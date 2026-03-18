# Keep Firebase
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-keep class com.scan2reachapp.models.** { *; }
-keep class org.webrtc.** { *; }
-keepattributes Signature
-keepattributes *Annotation*
-dontwarn sun.misc.**
-dontwarn okhttp3.**
-dontwarn okio.**
