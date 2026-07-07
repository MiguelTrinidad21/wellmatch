import Select from "react-select";


export default function YearSelector({ onChange, isChecked }) {
    const qualiCompleted = isChecked;

    let CURRENT_YEAR;
    let  START_YEAR;

    if (qualiCompleted) {
        CURRENT_YEAR = new Date().getFullYear();
        START_YEAR = 1967;
    } else {
        CURRENT_YEAR = 2041;
        START_YEAR = 2026;
    }

    const options = Array.from(
        { length: CURRENT_YEAR - START_YEAR + 1 },
        (_, i) => ({
            value: CURRENT_YEAR - i,
            label: CURRENT_YEAR - i,
        })
    );


  return (
    <Select
      options={options}
      placeholder="Year"
      onChange={(option) => onChange?.(option?.value)}
      menuPlacement="top"
    />
  );
}