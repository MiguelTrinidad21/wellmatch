import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

export default function MatchScore({ score, type, className }) {
    let color;

    if (score >= 80) {
        color = "#10B981"; // green
    } else if (score >= 60) {
        color = "#14B8A6"; // yellow
    } else {
        color = "#E33030"; // red
    }

    return (
        <div className={`w-35 h-35 m-auto flex justify-center items-center font-bold ${className}`}>
            <CircularProgressbar
                value={score}
                text={`${score}%`}
                styles={buildStyles({
                    pathColor: color,
                    textColor: type === "overall" ? "#fff" : "#000000",
                    trailColor: "#d1d5db",
                    strokeLinecap: "round"
                })}
            />
        </div>
    );
}