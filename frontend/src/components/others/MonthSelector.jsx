import Select from "react-select";


export default function MonthSelector({ onChange }) {

    const options = [
        { value: 0, label: "Jan" },
        { value: 1, label: "Feb" },
        { value: 2, label: "Mar" },
        { value: 3, label: "Apr" },
        { value: 4, label: "May" },
        { value: 5, label: "Jun" },
        { value: 6, label: "Jul" },
        { value: 7, label: "Aug" },
        { value: 8, label: "Sep" },
        { value: 9, label: "Oct" },
        { value: 10, label: "Nov" },
        { value: 11, label: "Dec" }
    ]


  return (
    <Select
      options={options}
      placeholder="Month"
      onChange={(option) => onChange?.(option?.value, option?.label)}
      menuPlacement="top"
    />
  );
}