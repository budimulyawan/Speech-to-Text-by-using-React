import axios from "axios";
import React, { useState, useEffect, useReducer } from "react";

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
  const brands = capitalizeFirstLetterArray([
    "Bebelac Madu",
    "VIT",
    "Sweety Bronze",
    "Frisian Flag UHT",
    "Bango Kecap",
    "Pouch",
    "Aqua",
    "Rinso",
    "ABC Kecap",
    "Amunizer",
    "You C1000 Vitamin",
    "Adem Sari Lemon",
    "Adem Sari Box",
    "ABC Sambal",
    "Bango Kecap Botol",
    "Samyang Chicken",
    "Samyang Carbo",
    "Sweety Silver",
    "Merries",
    "Fitti",
    "Mamy Poko",
    "Pantene Shampoo",
    "Garnier Men",
    "Biore Body Wash",
    "Casablanca Men",
    "Cap Lang Kayu Putih",
    "Certainty",
    "Lifree",
    "You C1000 Water",
    "Top Capuccinno",
    "Frisian Flag SKM",
    "Adem Sari Sparkling",
    "Walls Magnum Mango",
    "Pantene Conditioner",
    "Close UP",
    "Ponds Facial",
    "Garnier Micelar",
    "Beng beng",
    "Roma Cream Kelapa",
    "Gery Snack Sereal",
    "Garuda Rosta",
    "Garuda Pilus",
    "Walls Magnum Choco",
    "Top Coffee Gula Aren",
    "CUSSONS BABY WIPES",
    "TELON LANG PLUS",
    "BEBELAC VANILLA",
    "CUSSONS BABY TELON",
    "SOKLIN PEWANGI",
"SAYANG POWDER","SOKLIN LIQUID","RINSO LIQUID",
"PEPSODENT","REGAZZA","SAYANG LIQUID","GLOW & LOVELY",
"CHIL KID", "NUTRILON", "MORIGRO","Bebelac Gold"
  ]);
  let jsonObject = {};

  brands.forEach((item, index) => {
    jsonObject[item] = 0;
  });

  const [counter, setCounter] = useState(jsonObject);

  // function reducer(state, action) {
  //   if (action.type === "update") {
  //     console.log(state);
  //     jsonObject = {};
  //     brands.forEach((item, index) => {
  //       jsonObject[item] = state[item] += action.total[item]
  //     });
  //     console.log(jsonObject);
  //     return jsonObject;
  //   } else if (action.type === "reset") {
  //     jsonObject = {};
  //     brands.forEach((item, index) => {
  //       jsonObject[item] = 0;
  //     });
  //     return jsonObject;
  //   }
  //   throw Error("Unknown action.");
  // }

  // Cleanup function to stop recording and release media resources
  useEffect(() => {
    return () => {
      if (mediaRecorder) {
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [mediaRecorder]);

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
    while (
      (position = lowerCaseSentence.indexOf(lowerCasePhrase, position)) !== -1
    ) {
      count++;
      position += lowerCasePhrase.length; // Move the position forward to avoid counting the same occurrence again
    }

    return count;
  }

  useEffect(() => {
    if (transcription !== "") {
      let brandCount = {};
      brands.forEach((item, index) => {
        brandCount[item] = counter[item] + countPhrase(transcription, item);
      });
      setCounter(brandCount);
      console.log(brandCount);
    }
  }, [transcription]);

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
  function capitalizeFirstLetterArray(stringArray) {
    return stringArray.map(item => {
        // Split the element into words, capitalize the first letter of each, and rejoin
        return item
            .trim()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    });
}
  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      console.log("Recording stopped");
      setRecording(false);
    }
  };
  const resetCounter = () => {
    let jsonObject = {};

    brands.forEach((item, index) => {
      jsonObject[item] = 0;
    });
    setCounter(jsonObject);
  };

  const counterModel = (brand) => {
    return (
      <div
        style={{
          fontSize: "12px",
          color: "#212121",
          width: "100px",
          margin: "5px",
        
          lineHeight: "1.5",
          textAlign: "left",
          background: "white",
          padding: "20px",
          borderRadius: "5px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}
      >
        {brand}: {counter[brand]}
      </div>
    );
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
      <img src="https://alfamart.co.id/frontend/img/brand/logo_alfamart_transparent.png" alt="Logo Alfamart transparent"></img>
      

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
        Keyword: {brands.join(", ")}
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
          maxWidth: "80%",
          flexWrap: "wrap",
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          fontFamily: "Roboto, sans-serif",
        }}
      >
        {brands.map((b) => counterModel(b))}
      </div>
    </div>
  );

  return mode4;
};
export default App;
