import cv2
from app.eye_tracker import EyeTracker

tracker = EyeTracker()
cap = cv2.VideoCapture(0)

print("Press Q to quit")
while True:
    ret, frame = cap.read()
    if not ret:
        break
    metrics = tracker.process_frame(frame)
    print(f"EAR: {metrics['ear']} | Blinks: {metrics['blink_count']} | BPM: {metrics['bpm']} | Alert: {metrics['alert']}")
    cv2.imshow("EyeGuard Test", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()