import axios from "axios";
import React, { useState, useEffect } from "react";

// Function to convert audio blob to base64 encoded string
const audioBlobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const arrayBuffer = reader.result;
      const base64Audio = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ""
        )
      );
      resolve(base64Audio);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
};

const App = () => {
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [transcription, setTranscription] = useState("");
  const [counter, setCounter] = useState({
    fanta: 0,
    bengbeng: 0,
    aqua: 0,
    tehbotol: 0,
  });

  // Cleanup function to stop recording and release media resources
  useEffect(() => {
    return () => {
      if (mediaRecorder) {
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [mediaRecorder]);

  // function countPhrase(sentence, phrase) {
  //   console.log(sentence is function);
  //   // Convert both the sentence and phrase to lower case for case-insensitive matching
  //   const lowerCaseSentence = sentence.toLowerCase();
  //   const lowerCasePhrase = phrase.toLowerCase();

  //   // Split the sentence by the phrase and count the number of splits
  //   const parts = lowerCaseSentence.split(lowerCasePhrase);

  //   // The number of occurrences is one less than the number of splits
  //   return parts.length - 1;
  // }

  // function countPhrase(sentence, word) {
  //   // Convert the sentence to lowercase and split it into an array of words
  //   let wordsArray = sentence.toLowerCase().split(/\W+/);

  //   // Convert the word to lowercase
  //   let targetWord = word.toLowerCase();

  //   // Use the filter method to find matches and return the count
  //   let wordCount = wordsArray.filter((w) => w === targetWord).length;

  //   return wordCount;
  // }

  function countPhrase(sentence, phrase) {
    console.log(sentence);
    // Convert both sentence and phrase to lowercase to make the search case-insensitive
    const lowerCaseSentence = sentence.toLowerCase();
    const lowerCasePhrase = phrase.toLowerCase();

    // Initialize a counter to keep track of the number of occurrences
    let count = 0;

    // Initialize the position to start the search from
    let position = 0;

    // Loop through the sentence and count occurrences of the phrase
    while ((position = lowerCaseSentence.indexOf(lowerCasePhrase, position)) !== -1) {
      count++;
      position += lowerCasePhrase.length; // Move the position forward to avoid counting the same occurrence again
    }

    return count;
  }

  useEffect(() => {
    if (transcription !== "") {
      const totalFanta = countPhrase(transcription, "fanta");
      let totalBengbeng = countPhrase(transcription, "beng beng");
      totalBengbeng += countPhrase(transcription, "beng-beng");
      const totalAqua = countPhrase(transcription, "aqua");
      let totalTehBotol = countPhrase(transcription, "teh botol");
      totalTehBotol += countPhrase(transcription, "tehbotol");
      setCounter({
        fanta: totalFanta,
        bengbeng:  totalBengbeng,
        tehbotol: totalTehBotol,
        aqua: totalAqua,
      });
    }
  }, [
    transcription
  ]);

  if (!process.env.REACT_APP_GOOGLE_API_KEY) {
    throw new Error("REACT_APP_GOOGLE_API_KEY not found in the environment");
  }

  const apiKey = process.env.REACT_APP_GOOGLE_API_KEY;
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorder.start();
      console.log("Recording started");

      // Event listener to handle data availability
      recorder.addEventListener("dataavailable", async (event) => {
        console.log("Data available event triggered");
        const audioBlob = event.data;

        const base64Audio = await audioBlobToBase64(audioBlob);
        //console.log('Base64 audio:', base64Audio);

        try {
          const startTime = performance.now();

          const response = await axios.post(
            `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
            {
              config: {
                encoding: "WEBM_OPUS",
                sampleRateHertz: 48000,
                languageCode: "id-ID",
              },
              audio: {
                content: base64Audio,
              },
            }
          );

          const endTime = performance.now();
          const elapsedTime = endTime - startTime;

          //console.log('API response:', response);
          console.log("Time taken (ms):", elapsedTime);

          if (response.data.results && response.data.results.length > 0) {
            setTranscription(
              response.data.results[0].alternatives[0].transcript
            );
          } else {
            console.log(
              "No transcription results in the API response:",
              response.data
            );
            setTranscription("No transcription available");
          }
        } catch (error) {
          console.error(
            "Error with Google Speech-to-Text API:",
            error.response.data
          );
        }
      });

      setRecording(true);
      setMediaRecorder(recorder);
    } catch (error) {
      console.error("Error getting user media:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      console.log("Recording stopped");
      setRecording(false);
    }
  };

  const resetCounter = () => {
    setCounter({ fanta: 0, bengbeng: 0, aqua: 0, tehkotak: 0 });
  };

  const mode4 = (
    <div
      style={{
        background: "#E0E0E0",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Roboto, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "48px", color: "#3F51B5", marginBottom: "40px" }}>
        Alfamart Promo
      </h1>
      {!recording ? (
        <button
          onClick={startRecording}
          style={{
            background: "#4CAF50",
            color: "white",
            fontSize: "24px",
            padding: "10px 20px",
            borderRadius: "5px",
            border: "none",
            cursor: "pointer",
            marginBottom: "20px",
            boxShadow: "0 3px 5px rgba(0,0,0,0.3)",
          }}
        >
          Start Recording
        </button>
      ) : (
        <button
          onClick={stopRecording}
          style={{
            background: "#F44336",
            color: "white",
            fontSize: "24px",
            padding: "10px 20px",
            borderRadius: "5px",
            border: "none",
            cursor: "pointer",
            marginBottom: "20px",
            boxShadow: "0 3px 5px rgba(0,0,0,0.3)",
          }}
        >
          Stop Recording
        </button>
      )}
      <button
        onClick={resetCounter}
        style={{
          background: "#F44336",
          color: "white",
          fontSize: "24px",
          padding: "10px 20px",
          borderRadius: "5px",
          border: "none",
          cursor: "pointer",
          marginBottom: "20px",
          boxShadow: "0 3px 5px rgba(0,0,0,0.3)",
        }}
      >
        Reset Counter
      </button>

      <p
        style={{
          fontSize: "24px",
          color: "#212121",
          maxWidth: "80%",
          lineHeight: "1.5",
          textAlign: "left",
          background: "white",
          padding: "20px",
          borderRadius: "5px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}
      >
        Keyword: "Fanta, Teh botol, Aqua, Beng Beng"
      </p>
      <p
        style={{
          fontSize: "24px",
          color: "#212121",
          maxWidth: "80%",
          lineHeight: "1.5",
          textAlign: "left",
          background: "white",
          padding: "20px",
          borderRadius: "5px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}
      >
        Transcription: {transcription}
      </p>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          fontFamily: "Roboto, sans-serif",
        }}
      >
        <p
          style={{
            fontSize: "24px",
            color: "#212121",
            maxWidth: "80%",
            lineHeight: "1.5",
            textAlign: "left",
            background: "white",
            padding: "20px",
            borderRadius: "5px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          }}
        >
          Fanta: {counter.fanta}
        </p>
        <p
          style={{
            fontSize: "24px",
            color: "#212121",
            maxWidth: "80%",
            lineHeight: "1.5",
            textAlign: "left",
            background: "white",
            padding: "20px",
            borderRadius: "5px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          }}
        >
          Aqua: {counter.aqua}
        </p>
        <p
          style={{
            fontSize: "24px",
            color: "#212121",
            maxWidth: "80%",
            lineHeight: "1.5",
            textAlign: "left",
            background: "white",
            padding: "20px",
            borderRadius: "5px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          }}
        >
          Bengbeng: {counter.bengbeng}
        </p>
        <p
          style={{
            fontSize: "24px",
            color: "#212121",
            maxWidth: "80%",
            lineHeight: "1.5",
            textAlign: "left",
            background: "white",
            padding: "20px",
            borderRadius: "5px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          }}
        >
          Teh botol: {counter.tehbotol}
        </p>
      </div>
    </div>
  );

  return mode4;
};
export default App;
