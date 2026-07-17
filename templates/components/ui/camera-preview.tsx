import { useState } from "react"
import { Alert, Dimensions, StyleSheet, TouchableOpacity } from "react-native"
import * as MediaLibrary from "expo-media-library"
import { Download, Upload, X } from "lucide-react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { Button } from "@/components/ui/button"
import { Camera, CaptureSuccess } from "@/components/ui/camera"
import { Image } from "@/components/ui/image"
import { Text } from "@/components/ui/text"
import { Video } from "@/components/ui/video"
import { View } from "@/components/ui/view"
import { useColor } from "@/hooks/useColor"

const { width: screenWidth } = Dimensions.get("window")

export function CameraPreview() {
  const [showCamera, setShowCamera] = useState(false)
  const [cameraHeight, setCameraHeight] = useState((screenWidth * 4) / 3)
  const [capturedMedia, setCapturedMedia] = useState<{
    uri: string
    type: "picture" | "video"
  } | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [mediaLibraryPermission, requestMediaLibraryPermission] = MediaLibrary.usePermissions()

  const backgroundColor = useColor("background")
  const cardColor = useColor("card")
  const textColor = useColor("text")

  const handleCapture = (results: CaptureSuccess) => {
    setCameraHeight(results.cameraHeight)
    setCapturedMedia({ type: results.type, uri: results.uri })
    setShowCamera(false)
    setShowPreview(true)
  }

  const handleVideoCapture = (results: CaptureSuccess) => {
    setCameraHeight(results.cameraHeight)
    setCapturedMedia({ type: results.type, uri: results.uri })
    setShowCamera(false)
    setShowPreview(true)
  }

  const handleOpenCamera = () => {
    setCapturedMedia(null)
    setShowPreview(false)
    setShowCamera(true)
  }

  const handleCloseCamera = () => {
    setShowCamera(false)
  }

  const handleRetakeMedia = () => {
    setCapturedMedia(null)
    setShowPreview(false)
    setShowCamera(true)
  }

  const handleSaveToAlbum = async () => {
    if (!capturedMedia) return

    try {
      // Request permission if not granted
      if (mediaLibraryPermission?.status !== "granted") {
        const permission = await requestMediaLibraryPermission()
        if (!permission.granted) {
          Alert.alert(
            "Permission Required",
            "Please grant permission to save media to your picture library.",
          )
          return
        }
      }

      // Save to media library
      await MediaLibrary.saveToLibraryAsync(capturedMedia.uri)

      Alert.alert(
        "Success!",
        `${capturedMedia.type === "picture" ? "Photo" : "Video"} saved to your picture library.`,
        [
          {
            text: "OK",
            onPress: () => {
              setCapturedMedia(null)
              setShowPreview(false)
            },
          },
        ],
      )
    } catch (error) {
      console.error("Error saving to album:", error)
      Alert.alert("Error", "Failed to save media to your picture library.")
    }
  }

  const handleUploadAction = () => {
    if (!capturedMedia) return

    // This is where you would implement your upload logic
    // For example: upload to a server, save to database, etc.

    const mediaDetails = {
      uri: capturedMedia.uri,
      type: capturedMedia.type,
      timestamp: new Date().toISOString(),
      // Add any other metadata you need
    }

    console.log("Media details for upload/processing:", mediaDetails)

    // Example: Call your upload function
    // uploadToServer(mediaDetails);
    // saveToDatabase(mediaDetails);

    Alert.alert(
      "Upload Action",
      `${
        capturedMedia.type === "picture" ? "Photo" : "Video"
      } ready for processing.\n\nCheck console for media details.`,
      [
        {
          text: "Continue",
          onPress: () => {
            // You might want to keep the preview open or close it
            // depending on your use case
          },
        },
        {
          text: "Done",
          onPress: () => {
            // setCapturedMedia(null);
            // setShowPreview(false);
          },
        },
      ],
    )
  }

  // Preview Mode
  if (showPreview && capturedMedia) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <View style={[styles.previewContainer, { height: cameraHeight }]}>
          {capturedMedia.type === "picture" && capturedMedia.uri ? (
            <Image source={{ uri: capturedMedia.uri }} />
          ) : (
            <Video
              source={{ uri: capturedMedia.uri }}
              // nativeControls
              allowsFullscreen
              allowsPictureInPicture
            />
          )}

          {/* Top Floating Buttons */}
          <View style={styles.topFloatingButtons}>
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <TouchableOpacity
                style={[styles.floatingButton, { backgroundColor: cardColor, opacity: 0.9 }]}
                onPress={handleRetakeMedia}
                activeOpacity={0.8}
              >
                <X size={24} color={textColor} />
              </TouchableOpacity>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                }}
              >
                <TouchableOpacity
                  style={[styles.floatingButton, { backgroundColor: cardColor, opacity: 0.9 }]}
                  onPress={handleSaveToAlbum}
                  activeOpacity={0.8}
                >
                  <Download size={24} color={textColor} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.floatingButton, { backgroundColor: cardColor, opacity: 0.9 }]}
                  onPress={handleUploadAction}
                  activeOpacity={0.8}
                >
                  <Upload size={24} color={textColor} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  // Camera Mode
  if (showCamera) {
    return (
      <Camera
        onCapture={handleCapture}
        onVideoCapture={handleVideoCapture}
        onClose={handleCloseCamera}
        facing="back"
        enableTorch={true}
        showControls={true}
        enableVideo={true}
        style={{ flex: 1 }}
      />
    )
  }

  // Main Screen
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={styles.content}>
        <Text variant="heading" style={styles.title}>
          Camera Component
        </Text>

        <Text variant="body" style={styles.description}>
          Tap the button below to open the camera and capture photos or videos. After capturing, you
          can preview, save, or process your media.
        </Text>

        <View style={styles.buttonContainer}>
          <Button variant="default" size="lg" onPress={handleOpenCamera} style={styles.button}>
            Open Camera
          </Button>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  bottomActionContainer: {
    alignItems: "center",
    padding: 20,
  },
  button: {
    minWidth: 200,
  },
  buttonContainer: {
    alignItems: "center",
    gap: 16,
    width: "100%",
  },
  container: {
    flex: 1,
  },
  content: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  description: {
    marginBottom: 32,
    paddingHorizontal: 20,
    textAlign: "center",
  },
  floatingButton: {
    alignItems: "center",
    borderRadius: 28,
    elevation: 5,
    height: 56,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    width: 56,
  },
  lastCaptureContainer: {
    alignItems: "center",
    borderRadius: 12,
    marginBottom: 32,
    maxWidth: "100%",
    padding: 16,
  },
  lastCaptureTitle: {
    marginBottom: 12,
  },
  mediaInfo: {
    alignItems: "center",
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  mediaInfoSubtext: {
    fontSize: 14,
    textAlign: "center",
  },
  mediaInfoText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  playIcon: {
    fontSize: 24,
  },
  playIconOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  previewContainer: {
    borderRadius: 12,
    marginHorizontal: 0,
    overflow: "hidden",
    position: "relative",
    width: screenWidth,
  },
  previewMedia: {
    height: "100%",
    width: "100%",
  },
  thumbnailImage: {
    borderRadius: 8,
    height: 120,
    width: 120,
  },
  title: {
    marginBottom: 16,
    textAlign: "center",
  },
  topFloatingButtons: {
    alignItems: "center",
    bottom: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    left: 20,
    position: "absolute",
    right: 20,
  },
  uploadButton: {
    alignItems: "center",
    borderRadius: 12,
    elevation: 3,
    flexDirection: "row",
    paddingHorizontal: 32,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  uploadButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  uploadIcon: {
    marginRight: 12,
  },
  videoThumbnailContainer: {
    borderRadius: 8,
    height: 120,
    overflow: "hidden",
    position: "relative",
    width: 120,
  },
  viewButton: {
    borderRadius: 8,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  viewButtonText: {
    color: "white",
    fontWeight: "600",
  },
})
