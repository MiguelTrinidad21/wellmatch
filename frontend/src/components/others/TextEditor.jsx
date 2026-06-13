import { useState } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

export default function TextEditor({ value, func, placeholder }) {
    return (
        <ReactQuill
    className="
        [&_.ql-toolbar]:border-none
        [&_.ql-toolbar]:rounded-t-xl
        [&_.ql-toolbar]:bg-[#F9FAFB]
        [&_.ql-container]:border-none
        [&_.ql-container]:rounded-b-xl
        [&_.ql-editor]:rounded-b-xl
        [&_.ql-editor]:min-h-50
        [&_.ql-editor]:text-base
        [&_.ql-editor]:bg-[#F9FAFB]
        [&_.ql-editor]:shadow-md
        [&_.ql-editor]:font-sans
    "
    theme="snow"
    value={value}
    onChange={func}
    placeholder={placeholder}
/>
    );
}