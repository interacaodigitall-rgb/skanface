export interface FlutterCodeFile {
  filename: string;
  language: string;
  description: string;
  code: string;
}

export const FLUTTER_CODE_FILES: FlutterCodeFile[] = [
  {
    filename: 'face_camera_overlay_screen.dart',
    language: 'dart',
    description: 'Componente/Tela principal com inicialização dupla, câmera frontal ao vivo, sobreposição de vídeo oval do Supabase e prevenção de memory leaks.',
    code: `import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:video_player/video_player.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Tela de Câmera Facial com Sobreposição Oval de Vídeo do Supabase
/// 
/// Características principais:
/// - Inicialização dupla simultânea (Câmera + Supabase Storage)
/// - Câmera frontal em tela cheia com aspect ratio corrigido (sem distorções)
/// - Vídeo pré-gravado oval centralizado (autoplay, loop, muted, sem controles)
/// - Gerenciamento de ciclo de vida (WidgetsBindingObserver) para evitar memory leaks
/// - Fallback visual elegante para permissões negadas
class FaceCameraOverlayScreen extends StatefulWidget {
  final String bucketName;
  final String videoFilePath;
  final bool useSignedUrl;
  final Duration signedUrlExpiry;

  const FaceCameraOverlayScreen({
    super.key,
    this.bucketName = 'biometric-templates',
    this.videoFilePath = 'guides/face_guide_v1.mp4',
    this.useSignedUrl = false,
    this.signedUrlExpiry = const Duration(hours: 1),
  });

  @override
  State<FaceCameraOverlayScreen> createState() => _FaceCameraOverlayScreenState();
}

class _FaceCameraOverlayScreenState extends State<FaceCameraOverlayScreen>
    with WidgetsBindingObserver {
  // Controladores de Mídia
  CameraController? _cameraController;
  VideoPlayerController? _videoPlayerController;
  List<CameraDescription> _availableCameras = [];
  int _selectedCameraIndex = 0;

  // Estados de Carregamento e Permissões
  bool _isCameraReady = false;
  bool _isVideoReady = false;
  bool _isPermissionDenied = false;
  String? _errorMessage;

  // Cliente Supabase
  final SupabaseClient _supabase = Supabase.instance.client;

  @override
  void initState() {
    super.initState();
    // Registra observador do ciclo de vida para liberar/reativar câmera em segundo plano
    WidgetsBinding.instance.addObserver(this);
    _initializeScreen();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    final CameraController? camera = _cameraController;
    if (camera == null || !camera.value.isInitialized) return;

    if (state == AppLifecycleState.inactive || state == AppLifecycleState.paused) {
      // Libera a câmera quando o app for minimizado para economizar bateria e memória
      camera.dispose();
      _isCameraReady = false;
    } else if (state == AppLifecycleState.resumed) {
      // Re-inicializa a câmera ao voltar para o app
      _initializeCamera();
    }
  }

  /// [REQUISITO 1] Inicialização Dupla Simultânea
  /// Dispara a inicialização da câmera e a busca/carregamento do vídeo ao mesmo tempo
  Future<void> _initializeScreen() async {
    setState(() {
      _isPermissionDenied = false;
      _errorMessage = null;
      _isCameraReady = false;
      _isVideoReady = false;
    });

    try {
      await Future.wait([
        _initializeCamera(),
        _fetchAndInitSupabaseVideo(),
      ]);
    } catch (e) {
      debugPrint('[FaceCameraOverlay] Erro na inicialização dupla: $e');
    }
  }

  /// Inicializa a Câmera Frontal com resolução de alta definição
  Future<void> _initializeCamera() async {
    try {
      _availableCameras = await availableCameras();
      if (_availableCameras.isEmpty) {
        throw Exception('Nenhuma câmera encontrada no dispositivo.');
      }

      // Prioriza a câmera frontal (Selfie/Face)
      _selectedCameraIndex = _availableCameras.indexWhere(
        (cam) => cam.lensDirection == CameraLensDirection.front,
      );

      if (_selectedCameraIndex == -1) {
        _selectedCameraIndex = 0; // Fallback para a primeira câmera se não houver frontal
      }

      final camera = _availableCameras[_selectedCameraIndex];
      _cameraController = CameraController(
        camera,
        ResolutionPreset.high,
        enableAudio: false, // Desativa áudio do microfone na câmera para evitar consumo desnecessário
        imageFormatGroup: ImageFormatGroup.jpeg,
      );

      await _cameraController!.initialize();

      if (!mounted) return;
      setState(() {
        _isCameraReady = true;
      });
    } on CameraException catch (e) {
      debugPrint('[CameraException] Código: \${e.code}, Mensagem: \${e.description}');
      if (!mounted) return;
      if (e.code == 'CameraAccessDenied' || e.code == 'CameraAccessRestricted') {
        setState(() {
          _isPermissionDenied = true;
          _errorMessage = 'O acesso à câmera foi negado nas configurações.';
        });
      } else {
        setState(() {
          _errorMessage = 'Falha ao inicializar a câmera: \${e.description}';
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = 'Erro inesperado na câmera: $e';
      });
    }
  }

  /// [REQUISITO 4] Integração Supabase Storage & [REQUISITO 3] Configuração do Vídeo
  Future<void> _fetchAndInitSupabaseVideo() async {
    try {
      String videoUrl;

      // Resgata URL pública ou gera URL assinada temporária conforme configuração
      if (widget.useSignedUrl) {
        videoUrl = await _supabase.storage
            .from(widget.bucketName)
            .createSignedUrl(
              widget.videoFilePath,
              widget.signedUrlExpiry.inSeconds,
            );
      } else {
        videoUrl = _supabase.storage
            .from(widget.bucketName)
            .getPublicUrl(widget.videoFilePath);
      }

      debugPrint('[Supabase Storage] URL do vídeo obtida: $videoUrl');

      // Descarta controlador anterior se já existia
      await _videoPlayerController?.dispose();

      // Inicializa o player de vídeo com a URL de rede do Supabase
      _videoPlayerController = VideoPlayerController.networkUrl(
        Uri.parse(videoUrl),
        videoPlayerOptions: VideoPlayerOptions(
          mixWithOthers: true, // Permite coexistência com outros canais de áudio
        ),
      );

      await _videoPlayerController!.initialize();

      // [REQUISITO 3 - CRÍTICO PARA IOS/ANDROID/WEB]:
      // 1. Loop contínuo
      // 2. Muted (Volume 0.0 é obrigatório para autoplay em plataformas móveis e navegadores)
      // 3. Autoplay imediato
      // 4. Sem controles visíveis
      await _videoPlayerController!.setLooping(true);
      await _videoPlayerController!.setVolume(0.0);
      await _videoPlayerController!.play();

      if (!mounted) return;
      setState(() {
        _isVideoReady = true;
      });
    } catch (e) {
      debugPrint('[VideoPlayer] Falha ao carregar vídeo do Supabase: $e');
      if (!mounted) return;
      setState(() {
        _errorMessage = 'Não foi possível carregar o vídeo do Supabase Storage: $e';
      });
    }
  }

  /// Alterna entre câmera frontal e traseira
  Future<void> _toggleCamera() async {
    if (_availableCameras.length < 2) return;
    _selectedCameraIndex = (_selectedCameraIndex + 1) % _availableCameras.length;
    await _cameraController?.dispose();
    _cameraController = CameraController(
      _availableCameras[_selectedCameraIndex],
      ResolutionPreset.high,
      enableAudio: false,
    );
    await _cameraController!.initialize();
    if (mounted) setState(() {});
  }

  /// [EDGE CASE: Memory Leaks]
  /// Libera e destrói rigorosamente todos os recursos nativos de hardware e players
  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _cameraController?.dispose();
    _videoPlayerController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // 1. Estado de Erro de Permissão Negada (Fallback Elegante)
    if (_isPermissionDenied) {
      return _buildPermissionDeniedView();
    }

    // 2. Estado de Erro Geral
    if (_errorMessage != null && !_isCameraReady) {
      return _buildErrorView();
    }

    final bool isEverythingReady = _isCameraReady && _isVideoReady;

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // [REQUISITO 2 - CAMADA INFERIOR / FUNDO] Câmera ao vivo preenchendo a tela inteira
          if (_isCameraReady && _cameraController != null)
            _buildFullScreenCameraView()
          else
            const ColoredBox(color: Colors.black),

          // [REQUISITO 2 - CAMADA SUPERIOR / FRENTE] Player de vídeo em formato OVAL centralizado
          if (_isVideoReady && _videoPlayerController != null)
            Center(
              child: _buildOvalVideoPlayer(),
            ),

          // Indicador de Carregamento enquanto ambos não estão prontos
          if (!isEverythingReady)
            _buildLoadingOverlay(),

          // HUD Superior (Controles, status e alternância de câmera)
          _buildTopOverlayBar(),
        ],
      ),
    );
  }

  /// [EDGE CASE: Proporção de Tela da Câmera]
  /// Renderiza a câmera ao vivo cobrindo a tela inteira sem distorcer o aspecto
  Widget _buildFullScreenCameraView() {
    final camera = _cameraController!.value;
    final size = MediaQuery.of(context).size;

    // Calcula o fator de escala para preencher a tela mantendo a proporção (BoxFit.cover)
    var scale = size.aspectRatio * camera.aspectRatio;
    if (scale < 1) scale = 1 / scale;

    return ClipRect(
      child: Transform.scale(
        scale: scale,
        child: Center(
          child: CameraPreview(_cameraController!),
        ),
      ),
    );
  }

  /// [REQUISITO 2 e 3] Player de Vídeo em Formato Oval Centralizado
  /// - Recortado perfeitamente com ClipOval
  /// - AspectRatio / FittedBox com BoxFit.cover para não esticar o vídeo
  /// - Borda elegante decorativa
  Widget _buildOvalVideoPlayer() {
    final mediaSize = MediaQuery.of(context).size;
    // Dimensões do oval proporcionais à tela (formato retrato padrão para rosto)
    final double ovalWidth = mediaSize.width * 0.65;
    final double ovalHeight = ovalWidth * 1.35; // Proporção áurea vertical para biometria facial

    return Container(
      width: ovalWidth,
      height: ovalHeight,
      decoration: BoxDecoration(
        // Borda externa translúcida de alinhamento
        borderRadius: BorderRadius.all(
          Radius.elliptical(ovalWidth / 2, ovalHeight / 2),
        ),
        border: Border.all(
          color: const Color(0xFF00E5FF).withOpacity(0.8),
          width: 3.0,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF00E5FF).withOpacity(0.3),
            blurRadius: 18.0,
            spreadRadius: 2.0,
          ),
        ],
      ),
      child: ClipOval(
        child: SizedBox(
          width: ovalWidth,
          height: ovalHeight,
          child: FittedBox(
            fit: BoxFit.cover, // Previne que o vídeo fique esticado ou achatado
            child: SizedBox(
              width: _videoPlayerController!.value.size.width,
              height: _videoPlayerController!.value.size.height,
              child: VideoPlayer(_videoPlayerController!),
            ),
          ),
        ),
      ),
    );
  }

  /// Barra de controle e status superior
  Widget _buildTopOverlayBar() {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            // Botão Fechar / Voltar
            IconButton(
              icon: const Icon(Icons.close, color: Colors.white, size: 28),
              onPressed: () => Navigator.of(context).maybePop(),
              tooltip: 'Fechar',
            ),

            // Indicador de Status Supabase / Câmera
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, py: 6),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.55),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white24),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: (_isCameraReady && _isVideoReady)
                          ? const Color(0xFF00E676)
                          : const Color(0xFFFF9100),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    (_isCameraReady && _isVideoReady) ? 'AO VIVO' : 'SINCRONIZANDO',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),
            ),

            // Botão de Inversão da Câmera
            IconButton(
              icon: const Icon(Icons.flip_camera_ios, color: Colors.white, size: 26),
              onPressed: _availableCameras.length > 1 ? _toggleCamera : null,
              tooltip: 'Alternar Câmera',
            ),
          ],
        ),
      ),
    );
  }

  /// Tela de carregamento enquanto a câmera ou o vídeo não estiverem prontos
  Widget _buildLoadingOverlay() {
    return Container(
      color: Colors.black.withOpacity(0.75),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF00E5FF)),
              strokeWidth: 3,
            ),
            const SizedBox(height: 20),
            Text(
              !_isCameraReady
                  ? 'Acessando câmera frontal...'
                  : 'Buscando vídeo no Supabase Storage...',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 15,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// [EDGE CASE: Permissões Negadas]
  /// Interface elegante com ação direta para tentar novamente
  Widget _buildPermissionDeniedView() {
    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.redAccent.withOpacity(0.12),
                  ),
                  child: const Icon(
                    Icons.videocam_off_rounded,
                    size: 64,
                    color: Colors.redAccent,
                  ),
                ),
                const SizedBox(height: 24),
                const Text(
                  'Acesso à Câmera Necessário',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                const Text(
                  'Para validar seu rosto com o guia biométrico, conceda acesso à câmera nas configurações do seu sistema.',
                  style: TextStyle(color: Colors.white70, fontSize: 14, height: 1.5),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),
                ElevatedButton.icon(
                  onPressed: _initializeScreen,
                  icon: const Icon(Icons.refresh_rounded),
                  label: const Text('Tentar Novamente'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF00E5FF),
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  /// Visão de erro genérico
  Widget _buildErrorView() {
    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(32.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.warning_amber_rounded, size: 56, color: Colors.amber),
                const SizedBox(height: 16),
                const Text(
                  'Falha na Inicialização',
                  style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  _errorMessage ?? 'Erro desconhecido',
                  style: const TextStyle(color: Colors.white60, fontSize: 13),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                TextButton(
                  onPressed: _initializeScreen,
                  child: const Text('Recarregar'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
`
  },
  {
    filename: 'main.dart',
    language: 'dart',
    description: 'Ponto de entrada do aplicativo Flutter configurando a inicialização do Supabase SDK.',
    code: `import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'face_camera_overlay_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Inicialização do Supabase Client com o projeto do usuário
  await Supabase.initialize(
    url: const String.fromEnvironment(
      'SUPABASE_URL',
      defaultValue: 'https://xzytsgjlsyjwgcalbqid.supabase.co',
    ),
    anonKey: const String.fromEnvironment(
      'SUPABASE_ANON_KEY',
      defaultValue: 'sua-chave-anon-publica-aqui',
    ),
  );

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Supabase Face Camera Oval Overlay',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: Colors.black,
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF00E5FF),
          secondary: Color(0xFF3ECF8E), // Cor oficial do Supabase
        ),
      ),
      home: const FaceCameraOverlayScreen(
        bucketName: 'biometric-templates',
        videoFilePath: 'guides/face_guide_v1.mp4',
        useSignedUrl: false, // Defina true se seu bucket for privado
      ),
    );
  }
}
`
  },
  {
    filename: 'pubspec.yaml',
    language: 'yaml',
    description: 'Dependências necessárias no pubspec.yaml do Flutter.',
    code: `name: face_camera_supabase_overlay
description: "Camera facial com sobreposição de video oval pré-gravado do Supabase"
publish_to: "none"
version: 1.0.0+1

environment:
  sdk: ">=3.0.0 <4.0.0"
  flutter: ">=3.10.0"

dependencies:
  flutter:
    sdk: flutter

  # Plugins Essenciais para Mídia e Supabase
  camera: ^0.10.6
  video_player: ^2.8.2
  supabase_flutter: ^2.3.4
  permission_handler: ^11.3.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true
`
  },
  {
    filename: 'ios_permissions.plist',
    language: 'xml',
    description: 'Configuração de permissões no arquivo ios/Runner/Info.plist (Obrigatório para iOS).',
    code: `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- Permissão de Câmera (Obrigatória para o plugin camera) -->
    <key>NSCameraUsageDescription</key>
    <string>Precisamos da sua câmera frontal para validar seu enquadramento facial.</string>

    <!-- Permissão de Microfone (Opcional, desativado no código, mas recomendado pelo plugin) -->
    <key>NSMicrophoneUsageDescription</key>
    <string>Utilizado para captura de áudio se habilitado.</string>

    <!-- Permissão de Rede para streaming do vídeo do Supabase Storage -->
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key>
        <true/>
    </dict>
</dict>
</plist>
`
  },
  {
    filename: 'android_permissions.xml',
    language: 'xml',
    description: 'Permissões necessárias em android/app/src/main/AndroidManifest.xml.',
    code: `<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Permissões de Hardware e Câmera -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-feature android:name="android.hardware.camera" />
    <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />
    <uses-feature android:name="android.hardware.camera.front" android:required="false" />

    <!-- Permissão de Acesso à Internet para o Supabase Storage -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:label="face_camera_supabase_overlay"
        android:name="\${applicationName}"
        android:icon="@mipmap/ic_launcher">
        <!-- Configurações adicionais de inicialização aqui -->
    </application>
</manifest>
`
  }
];
