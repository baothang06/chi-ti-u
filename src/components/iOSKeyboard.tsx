import React, { useState } from "react";
import { Delete, Globe, Mic, CornerDownLeft, Smile } from "lucide-react";

interface IOSKeyboardProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onSpace: () => void;
  onClose: () => void;
  numericOnly?: boolean;
}

export default function IOSKeyboard({
  onKeyPress,
  onDelete,
  onSpace,
  onClose,
  numericOnly = false
}: IOSKeyboardProps) {
  const [isShift, setIsShift] = useState(false);
  const [layoutMode, setLayoutMode] = useState<"alpha" | "numeric">("alpha");

  const row1 = ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"];
  const row2 = ["a", "s", "d", "f", "g", "h", "j", "k", "l"];
  const row3 = ["z", "x", "c", "v", "b", "n", "m"];

  const numRow1 = ["1", "2", "3"];
  const numRow2 = ["4", "5", "6"];
  const numRow3 = ["7", "8", "9"];
  const numRow4 = [".", "0", "000"];

  const handleKeyClick = (char: string) => {
    let output = char;
    if (layoutMode === "alpha") {
      output = isShift ? char.toUpperCase() : char.toLowerCase();
    }
    onKeyPress(output);
  };

  return (
    <div className="w-full bg-[#161618] select-none border-t border-white/5 pt-2 pb-6 px-1.5 transition-all duration-300 animate-[slideUp_0.25s_ease-out]">
      {numericOnly || layoutMode === "numeric" ? (
        <div className="max-w-md mx-auto flex flex-col gap-2">
          {/* Numeric Layout */}
          <div className="grid grid-cols-3 gap-2">
            {[...numRow1, ...numRow2, ...numRow3].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeyClick(num)}
                className="ios-keyboard-key active:opacity-60 text-white text-2xl font-medium py-3 rounded-lg flex items-center justify-center transition-all duration-100"
              >
                {num}
              </button>
            ))}
            {/* Last Row */}
            <button
              type="button"
              onClick={() => handleKeyClick(numRow4[0])}
              className="ios-keyboard-key active:opacity-60 text-white text-2xl font-semibold py-3 rounded-lg flex items-center justify-center"
            >
              {numRow4[0]}
            </button>
            <button
              type="button"
              onClick={() => handleKeyClick(numRow4[1])}
              className="ios-keyboard-key active:opacity-60 text-white text-2xl font-semibold py-3 rounded-lg flex items-center justify-center"
            >
              {numRow4[1]}
            </button>
            <button
              type="button"
              onClick={() => handleKeyClick(numRow4[2])}
              className="ios-keyboard-key active:opacity-60 text-white text-lg font-medium py-3 rounded-lg flex items-center justify-center"
            >
              {numRow4[2]}
            </button>
          </div>

          {/* Action Row */}
          <div className="grid grid-cols-4 gap-2 mt-1">
            {!numericOnly && (
              <button
                type="button"
                onClick={() => setLayoutMode("alpha")}
                className="bg-white/10 active:opacity-60 text-white text-[15px] font-semibold py-3.5 rounded-lg text-center"
              >
                ABC
              </button>
            )}
            <button
              type="button"
              onClick={onSpace}
              className={`${numericOnly ? "col-span-2" : "col-span-2"} bg-white/15 active:opacity-60 text-white/70 text-sm py-3.5 rounded-lg text-center font-medium`}
            >
              space
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="bg-white/10 active:opacity-60 text-white py-3.5 rounded-lg flex items-center justify-center"
            >
              <Delete size={20} />
            </button>
            {numericOnly && (
              <button
                type="button"
                onClick={onClose}
                className="bg-[#007AFF] active:opacity-80 text-white text-[15px] font-semibold py-3.5 rounded-lg flex items-center justify-center"
              >
                Done
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-md mx-auto flex flex-col gap-2">
          {/* Alphabet Layout */}
          {/* Row 1 */}
          <div className="flex gap-[5px] justify-center">
            {row1.map((char) => (
              <button
                key={char}
                type="button"
                onClick={() => handleKeyClick(char)}
                className="ios-keyboard-key active:opacity-60 w-8 h-10 text-white text-lg rounded-[5px] flex items-center justify-center font-normal capitalize"
              >
                {isShift ? char.toUpperCase() : char}
              </button>
            ))}
          </div>

          {/* Row 2 */}
          <div className="flex gap-[5px] justify-center px-4">
            {row2.map((char) => (
              <button
                key={char}
                type="button"
                onClick={() => handleKeyClick(char)}
                className="ios-keyboard-key active:opacity-60 w-8 h-10 text-white text-lg rounded-[5px] flex items-center justify-center font-normal"
              >
                {isShift ? char.toUpperCase() : char}
              </button>
            ))}
          </div>

          {/* Row 3 */}
          <div className="flex gap-[5px] justify-center items-center">
            <button
              type="button"
              onClick={() => setIsShift(!isShift)}
              className={`w-10 h-10 rounded-[5px] flex items-center justify-center text-white transition-colors duration-150 ${isShift ? "bg-white text-black" : "bg-white/15"}`}
            >
              <span className="text-lg font-bold">⇧</span>
            </button>

            <div className="flex gap-[5px] flex-1 justify-center">
              {row3.map((char) => (
                <button
                  key={char}
                  type="button"
                  onClick={() => handleKeyClick(char)}
                  className="ios-keyboard-key active:opacity-60 w-8 h-10 text-white text-lg rounded-[5px] flex items-center justify-center font-normal"
                >
                  {isShift ? char.toUpperCase() : char}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onDelete}
              className="w-10 h-10 bg-white/15 rounded-[5px] active:bg-white/30 flex items-center justify-center text-white"
            >
              <Delete size={18} />
            </button>
          </div>

          {/* Row 4 */}
          <div className="flex gap-2 justify-between items-center mt-1">
            <button
              type="button"
              onClick={() => setLayoutMode("numeric")}
              className="w-[12%] h-11 bg-white/15 rounded-[5px] active:bg-white/30 flex items-center justify-center text-white text-sm font-medium"
            >
              123
            </button>

            <button
              type="button"
              className="w-[10%] h-11 bg-white/10 rounded-[5px] flex items-center justify-center text-white"
            >
              <Globe size={18} />
            </button>

            <button
              type="button"
              onClick={onSpace}
              className="flex-1 h-11 bg-white/20 active:bg-white/30 rounded-[5px] flex items-end justify-center pb-1 relative text-sm text-white/50 font-normal"
            >
              <span className="absolute top-1 text-[10px] text-white/30 font-semibold tracking-wider">SPACE</span>
              <span className="text-xs text-white/60 font-medium">vi</span>
            </button>

            <button
              type="button"
              className="w-[10%] h-11 bg-white/10 rounded-[5px] flex items-center justify-center text-white"
            >
              <Smile size={18} />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-[18%] h-11 bg-[#007AFF] active:bg-[#0060C0] rounded-[5px] text-white text-sm font-bold flex items-center justify-center gap-1"
            >
              <span>return</span>
              <CornerDownLeft size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
