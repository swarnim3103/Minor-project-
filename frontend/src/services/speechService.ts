export interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
}

export function createSpeechRecognition(
  onResult: (result: SpeechRecognitionResult) => void,
  onError: (error: string) => void,
  onEnd: () => void
) {
  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    throw new Error(
      "Speech recognition is not supported in this browser."
    );
  }

  const recognition = new SpeechRecognition();

  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-IN";

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    let transcript = "";
    let isFinal = false;

    for (
      let i = event.resultIndex;
      i < event.results.length;
      i++
    ) {
      transcript += event.results[i][0].transcript;

      if (event.results[i].isFinal) {
        isFinal = true;
      }
    }

    onResult({
      transcript,
      isFinal,
    });
  };

  recognition.onerror = (event: any) => {
    onError(event.error || "Speech recognition failed.");
  };

  recognition.onend = () => {
    onEnd();
  };

  return recognition;
}