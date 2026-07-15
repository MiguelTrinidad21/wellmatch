import { useEffect, useState, useRef } from "react";
import { renderAsync } from "docx-preview";
import { Document, Page, pdfjs } from "react-pdf";
import { IoClose } from "react-icons/io5";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { MdDownload } from "react-icons/md";

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

const ResumeViewerModal = ({ resumeID, onClose, user }) => {
    const isApplicant = user === "applicant"

    const [fileUrl, setFileUrl] = useState(null);
    const [origFileName, setOrigFileName] = useState(null);
    const [blob, setBlob] = useState(null);
    const [numPages, setNumPages] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const docxContainerRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(null);

    const isDocx = origFileName?.toLowerCase().endsWith('.docx');
    const isPdf = origFileName?.toLowerCase().endsWith('.pdf') 
               || origFileName?.toLowerCase().endsWith('.PDF');

    useEffect(() => {
        const updateWidth = () => {
            if (docxContainerRef.current) {
                const style = window.getComputedStyle(docxContainerRef.current);
                const paddingLeft = parseFloat(style.paddingLeft);
                const paddingRight = parseFloat(style.paddingRight);
                setContainerWidth(docxContainerRef.current.clientWidth - paddingLeft - paddingRight);
            }
        };

        updateWidth();
        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    useEffect(() => {
        const fetchResume = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');

                let response;

                if (isApplicant) {
                    response = await fetch(`/api/applicant/viewResume/${resumeID}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                } else {
                    response = await fetch(`/api/employer/viewResume/${resumeID}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });                    
                }

                if (!response.ok) throw new Error(`Error: ${response.status}`);

                // Get filename from response header
                const disposition = response.headers.get('Content-Disposition');
                const nameMatch = disposition?.match(/filename="(.+)"/);
                const fileName = nameMatch?.[1] ?? 'resume';
                setOrigFileName(fileName);

                // ✅ Convert streamed response to blob for docx-preview / react-pdf
                const rawBlob = await response.blob();
                console.log('Blob size:', rawBlob.size, 'type:', rawBlob.type);
                setBlob(rawBlob);
                setFileUrl(URL.createObjectURL(rawBlob)); // only for download button

            } catch (err) {
                console.error('❌ Error:', err.message);
                setError('Network timed out. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchResume();

        return () => {
            if (fileUrl) URL.revokeObjectURL(fileUrl);
        };
    }, [resumeID]);

    // ✅ Render DOCX once blob and ref are both ready
    useEffect(() => {
        if (isDocx && blob && docxContainerRef.current) {
            docxContainerRef.current.innerHTML = ''; // clear previous render
            renderAsync(blob, docxContainerRef.current, null, {
                className: "docx-preview",
                inWrapper: true,
                ignoreWidth: false,
                ignoreHeight: false,
                ignoreFonts: false,
                breakPages: true,
                useBase64URL: true,
            }).catch(() => setError('Failed to render DOCX.'));
        }
    }, [blob, isDocx]);

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center gap-10 p-4">
            <div className="bg-white rounded-xl w-[95%] max-w-4xl h-[90vh] flex flex-col shadow-2xl">

                {/* Header */}
                <div className="relative px-6 py-4 border-b flex justify-between bg-green-600 rounded-tl-xl rounded-tr-xl text-white">
                    <h2 className="font-semibold text-sm">
                        {origFileName ?? 'Loading...'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="cursor-pointer absolute right-3 top-3"
                    >
                        <IoClose size={25} />
                    </button>
                </div>

                {/* Body */}
                <div ref={docxContainerRef} className="flex-1 overflow-auto p-4">

                    {loading && (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-gray-500 animate-pulse">Loading resume...</div>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center justify-center h-full text-red-500">
                            {error}
                        </div>
                    )}

                    {/* DOCX — docx-preview renders into this div */}
                    {!loading && !error && isDocx && (
                        <div ref={docxContainerRef} className="w-full h-full" />
                    )}

                    {/* PDF — react-pdf */}
                    {!loading && !error && isPdf && blob && (
                        <div className="flex flex-col items-center gap-4">
                            <Document
                                file={blob}
                                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                                onLoadError={() => setError('Failed to render PDF.')}
                            >
                                {Array.from({ length: numPages || 0 }, (_, i) => (
                                    <Page
                                        key={i + 1}
                                        pageNumber={i + 1}
                                        width={containerWidth ?? undefined}
                                        className="mb-4 shadow-md"
                                    />
                                ))}
                            </Document>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {fileUrl && (
                    <div className="px-6 py-3 border-t flex justify-center">
                        <a
                            href={fileUrl}
                            download={origFileName}
                            className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600 transition-colors duration-200 ease-in flex items-center gap-2 font-semibold"
                        >
                            <MdDownload />
                            Download
                        </a>
                    </div>
                )}

            </div>
        </div>
    );
};

export default ResumeViewerModal;