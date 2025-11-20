/**
 * Morse Code Converter
 * Convert text to/from Morse code with audio playback and visual signals
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  Radio,
  ToggleLeft,
  Copy,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

// Morse code mapping
const MORSE_CODE: Record<string, string> = {
  A: ".-",
  B: "-...",
  C: "-.-.",
  D: "-..",
  E: ".",
  F: "..-.",
  G: "--.",
  H: "....",
  I: "..",
  J: ".---",
  K: "-.-",
  L: ".-..",
  M: "--",
  N: "-.",
  O: "---",
  P: ".--.",
  Q: "--.-",
  R: ".-.",
  S: "...",
  T: "-",
  U: "..-",
  V: "...-",
  W: ".--",
  X: "-..-",
  Y: "-.--",
  Z: "--..",
  "0": "-----",
  "1": ".----",
  "2": "..---",
  "3": "...--",
  "4": "....-",
  "5": ".....",
  "6": "-....",
  "7": "--...",
  "8": "---..",
  "9": "----.",
  ".": ".-.-.-",
  ",": "--..--",
  "?": "..--..",
  "'": ".----.",
  "!": "-.-.--",
  "/": "-..-.",
  "(": "-.--.",
  ")": "-.--.-",
  "&": ".-...",
  ":": "---...",
  ";": "-.-.-.",
  "=": "-...-",
  "+": ".-.-.",
  "-": "-....-",
  _: "..--.-",
  '"': ".-..-.",
  $: "...-..",
  "@": ".--.-.",
  " ": " ",
  "\n": "\n",
};

// Reverse mapping for morse to text
const REVERSE_MORSE: Record<string, string> = {};
for (const [key, value] of Object.entries(MORSE_CODE)) {
  REVERSE_MORSE[value] = key;
}

interface AudioSettings {
  frequency: number; // Hz
  wpm: number; // Words per minute
  dahDuration: number; // ms (duration of dash)
  frequencyUnit: number; // Frequency for units
}

interface VisualSignal {
  text: string;
  type: "dot" | "dash" | "space" | "character" | "word";
  duration: number;
}

export const MorseCodeConverter: React.FC = () => {
  const [text, setText] = useState("");
  const [morseCode, setMorseCode] = useState("");
  const [convertingToText, setConvertingToText] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showVisualSignals, setShowVisualSignals] = useState(false);
  const [currentSignal, setCurrentSignal] = useState<VisualSignal | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(20); // WPM
  const [volume, setVolume] = useState(0.5);
  const [audioSettings, setAudioSettings] = useState<AudioSettings>({
    frequency: 600,
    wpm: 20,
    dahDuration: 3, // 3x dot duration
    frequencyUnit: 800,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const playbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== "undefined" && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    return () => {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  // Convert text to morse code
  const textToMorse = (input: string): string => {
    return input
      .toUpperCase()
      .split("")
      .map((char) => {
        // Handle multiple consecutive spaces
        if (char === " ") {
          // Check for consecutive spaces (word separator)
          const nextCharIndex = input.toUpperCase().indexOf(" ", input.indexOf(char) + 1);
          if (nextCharIndex === input.indexOf(char) + 1) {
            return "   "; // Three spaces for word separator
          } else {
            return " "; // Single space for letter separator
          }
        }
        return MORSE_CODE[char] || char; // Return original char if not found
      })
      .join("");
  };

  // Convert morse code to text
  const morseToText = (input: string): string => {
    const morseWords = input.trim().split("   "); // Split by word separators
    return morseWords
      .map((word) => {
        const morseChars = word.split(" ").filter((char) => char.length > 0); // Filter out empty spaces
        return morseChars.map((morseChar) => REVERSE_MORSE[morseChar] || "?").join("");
      })
      .join(" ");
  };

  // Get timing in milliseconds
  const getTiming = (): { dot: number; dash: number; character: number; word: number } => {
    const dotDuration = 1200 / audioSettings.wpm; // Standard timing formula
    return {
      dot: dotDuration,
      dash: dotDuration * audioSettings.dahDuration,
      character: dotDuration * 3, // Inter-character gap
      word: dotDuration * 7, // Inter-word gap (7 units)
    };
  };

  // Play a single tone
  const playTone = (frequency: number, duration: number): Promise<void> => {
    return new Promise((resolve) => {
      if (!audioContextRef.current) {
        resolve();
        return;
      }

      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = "sine";

      gainNode.gain.value = volume;
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        audioContextRef.current.currentTime + duration / 1000,
      );

      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + duration / 1000);

      oscillator.onended = () => resolve();
    });
  };

  // Play a morse character
  const playMorseCharacter = async (char: string): Promise<void> => {
    const timing = getTiming();

    switch (char) {
      case ".":
        await playTone(audioSettings.frequency, timing.dot);
        break;
      case "-":
        await playTone(audioSettings.frequency, timing.dash);
        break;
      case " ":
        // Intra-character gap (silence)
        break;
      case "\n":
        // Word gap (silence)
        break;
    }

    // Small delay between elements
    await new Promise((resolve) => setTimeout(resolve, 50));
  };

  // Play entire morse code
  const playMorseCode = async () => {
    if (!audioContextRef.current) {
      alert("Audio not supported in this browser");
      return;
    }

    setIsPlaying(true);
    setConvertingToText(false);

    try {
      const sequence = convertingToText ? morseToText(morseCode) : textToMorse(text);
      const chars = sequence.split("");

      for (const char of chars) {
        await playMorseCharacter(char);
      }
    } catch (error) {
      console.error("Error playing morse code:", error);
    } finally {
      setIsPlaying(false);
    }
  };

  // Stop playback
  const stopPlayback = () => {
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
      } catch (e) {
        // Ignore errors when oscillator is already stopped
      }
      oscillatorRef.current = null;
    }

    if (playbackTimeoutRef.current) {
      clearTimeout(playbackTimeoutRef.current);
      playbackTimeoutRef.current = null;
    }

    setIsPlaying(false);
  };

  // Convert to morse code
  const handleToMorse = () => {
    if (!text.trim()) {
      return;
    }
    setConvertingToText(false);
    const result = textToMorse(text);
    setMorseCode(result);
  };

  // Convert from morse code
  const handleFromMorse = () => {
    if (!morseCode.trim()) {
      return;
    }
    setConvertingToText(true);
    const result = morseToText(morseCode);
    setText(result);
  };

  // Show visual signals
  const handleShowVisual = () => {
    if (!morseCode.trim()) {
      return;
    }
    setShowVisualSignals(true);
    displayVisualSignals();
  };

  // Display visual signals
  const displayVisualSignals = async () => {
    const sequence = convertingToText ? morseToText(morseCode) : textToMorse(text);
    const chars = sequence.split("");

    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      let type: "dot" | "dash" | "space" | "character" | "word";
      let duration: number;

      switch (char) {
        case ".":
          type = "dot";
          duration = getTiming().dot;
          break;
        case "-":
          type = "dash";
          duration = getTiming().dash;
          break;
        case " ":
          type = char.length === 3 ? "word" : "character"; // 3 spaces = word separator
          duration = char.length === 3 ? getTiming().word : getTiming().character;
          break;
        default:
          continue; // Skip unrecognized characters
      }

      setCurrentSignal({ text: char, type, duration });
      await new Promise((resolve) => setTimeout(resolve, duration));
    }

    setCurrentSignal(null);
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  // Get signal color
  const getSignalColor = (type: string): string => {
    switch (type) {
      case "dot":
        return "bg-green-500";
      case "dash":
        return "bg-blue-500";
      case "character":
        return "bg-yellow-500";
      case "word":
        return "bg-orange-500";
      case "space":
        return "bg-gray-200";
      default:
        return "bg-gray-400";
    }
  };

  // Update playback speed
  const updatePlaybackSpeed = (wpm: number) => {
    setAudioSettings((prev) => ({
      ...prev,
      wpm,
      dahDuration: 3, // Keep 3:1 ratio
    }));
  };

  return (
    <div className="space-y-6">
      {/* Audio Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="w-5 h-5" />
            Audio Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="frequency">Tone Frequency (Hz)</Label>
              <Slider
                id="frequency"
                value={[audioSettings.frequency]}
                onValueChange={([value]) =>
                  setAudioSettings((prev) => ({ ...prev, frequency: value }))
                }
                min={200}
                max={1200}
                step={10}
                className="mt-2"
              />
              <div className="flex justify-between text-sm text-gray-600">
                <span>200 Hz</span>
                <span>{audioSettings.frequency} Hz</span>
                <span>1200 Hz</span>
              </div>
            </div>

            <div>
              <Label htmlFor="speed">Speed (WPM)</Label>
              <Slider
                id="speed"
                value={[audioSettings.wpm]}
                onValueChange={([value]) => updatePlaybackSpeed(value)}
                min={5}
                max={60}
                step={1}
                className="mt-2"
              />
              <div className="flex justify-between text-sm text-gray-600">
                <span>5 WPM</span>
                <span>{audioSettings.wpm} WPM</span>
                <span>60 WPM</span>
              </div>
            </div>

            <div>
              <Label htmlFor="volume">Volume</Label>
              <Slider
                id="volume"
                value={[volume * 100]}
                onValueChange={([value]) => setVolume(value / 100)}
                min={0}
                max={100}
                step={5}
                className="mt-2"
              />
              <div className="flex justify-between text-sm text-gray-600">
                <span>0%</span>
                <span>{Math.round(volume * 100)}%</span>
                <span>100%</span>
              </div>
            </div>

            <div>
              <Label htmlFor="frequency-unit">Unit Tone Frequency (Hz)</Label>
              <Slider
                id="frequency-unit"
                value={[audioSettings.frequencyUnit]}
                onValueChange={([value]) =>
                  setAudioSettings((prev) => ({ ...prev, frequencyUnit: value }))
                }
                min={400}
                max={1200}
                step={10}
                className="mt-2"
              />
              <div className="flex justify-between text-sm text-gray-600">
                <span>400 Hz</span>
                <span>{audioSettings.frequencyUnit} Hz</span>
                <span>1200 Hz</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversion Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ToggleLeft className="w-5 h-5" />
            Text ↔ Morse Code Conversion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={convertingToText ? "morse-to-text" : "text-to-morse"} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text-to-morse">Text → Morse</TabsTrigger>
              <TabsTrigger value="morse-to-text">Morse → Text</TabsTrigger>
            </TabsList>

            <TabsContent value="text-to-morse">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="text-input">Text Input</Label>
                  <Textarea
                    id="text-input"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter text to convert to Morse code..."
                    className="min-h-[120px] font-mono text-sm"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleToMorse} disabled={!text.trim()}>
                    Convert to Morse
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMorseCode(textToMorse(text));
                      setIsPlaying(false);
                    }}
                    disabled={!text.trim()}
                  >
                    Preview
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="morse-to-text">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="morse-input">Morse Code Input</Label>
                  <Textarea
                    id="morse-input"
                    value={morseCode}
                    onChange={(e) => setMorseCode(e.target.value)}
                    placeholder="Enter Morse code to convert to text..."
                    className="min-h-[120px] font-mono text-sm"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Use space for letter separation, three spaces for word separation
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleFromMorse} disabled={!morseCode.trim()}>
                    Convert to Text
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setText(morseToText(morseCode));
                      setConvertingToText(true);
                    }}
                    disabled={!morseCode.trim()}
                  >
                    Preview
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-4">
            <Label>Morse Code Result</Label>
            <Textarea
              value={convertingToText ? text : morseCode}
              readOnly
              className="min-h-[120px] font-mono text-sm bg-gray-50"
            />
            <div className="flex gap-2 mt-2">
              <Button
                variant="outline"
                onClick={() => copyToClipboard(convertingToText ? text : morseCode)}
                disabled={!text && !morseCode}
              >
                Copy Text
              </Button>
              <Button
                variant="outline"
                onClick={() => copyToClipboard(convertingToText ? morseCode : text)}
                disabled={!text && !morseCode}
              >
                Copy Morse
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Playback Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            Audio Playback
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              onClick={playMorseCode}
              disabled={isPlaying || (!text && !morseCode)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 mr-1" />
                  Playing
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-1" />
                  Play Audio
                </>
              )}
            </Button>

            {isPlaying && (
              <Button variant="destructive" onClick={stopPlayback}>
                <VolumeX className="w-4 h-4 mr-1" />
                Stop
              </Button>
            )}

            <Button variant="outline" onClick={handleShowVisual} disabled={!text && !morseCode}>
              <SkipForward className="w-4 h-4 mr-1" />
              Visual Signals
            </Button>
          </div>

          {isPlaying && (
            <Alert>
              <Radio className="h-4 w-4" />
              <AlertDescription>
                Playing Morse code at {audioSettings.wpm} WPM ({audioSettings.frequency} Hz tone)
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Visual Signals */}
      {showVisualSignals && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ToggleLeft className="w-5 h-5" />
                Visual Signals
              </span>
              <Button variant="outline" size="sm" onClick={() => setShowVisualSignals(false)}>
                Close
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center min-h-[32] p-8 bg-gray-900 rounded-lg">
              {currentSignal ? (
                <div
                  className={`w-24 h-24 rounded-full ${getSignalColor(currentSignal.type)} animate-pulse`}
                  title={currentSignal.text}
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-700" />
              )}
            </div>

            <div className="mt-4 text-center text-sm text-gray-600">
              {currentSignal ? (
                <>
                  <p>Signal: {currentSignal.text}</p>
                  <p>Type: {currentSignal.type}</p>
                  <p>Duration: {currentSignal.duration}ms</p>
                </>
              ) : (
                <p>No signal being transmitted</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reference Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Morse Code Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            {Object.entries(MORSE_CODE)
              .filter(([key]) => key !== "\n" && key !== " ")
              .slice(0, 26) // Letters only
              .map(([key, code]) => (
                <div key={key} className="flex justify-between items-center p-2 border rounded">
                  <span className="font-bold w-8">{key}</span>
                  <span className="font-mono text-blue-600">{code}</span>
                </div>
              ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm mt-4">
            {Object.entries(MORSE_CODE)
              .filter(([key]) => /\d/.test(key))
              .map(([key, code]) => (
                <div key={key} className="flex justify-between items-center p-2 border rounded">
                  <span className="font-bold w-8">{key}</span>
                  <span className="font-mono text-green-600">{code}</span>
                </div>
              ))}
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded">
            <h4 className="font-semibold mb-2">Special Characters</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {Object.entries(MORSE_CODE)
                .filter(([key]) => /[^\w\d]/.test(key))
                .slice(0, 8) // First 8 special characters
                .map(([key, code]) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className="font-mono w-6">{key}</span>
                    <span className="font-mono text-purple-600">{code}</span>
                  </div>
                ))}
            </div>
          </div>

          <Alert>
            <Radio className="h-4 w-4" />
            <AlertDescription>
              <strong>Timing:</strong> Dot = 1 unit, Dash = 3 units, Character gap = 3 units, Word
              gap = 7 units
              <br />
              <strong>Audio:</strong> Standard tone frequency is 600Hz, typical speed is 20 WPM
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};
