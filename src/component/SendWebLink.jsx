import React, { useRef, useState,useEffect } from "react";
import axios from "axios";
import api, { API_URL } from "../api/axios";
import ImageTranslater from "./ImageTranslater";
export default function SendWebLink() {
    const [url, setUrl] = useState("");
    const [targetLanguage, setTargetLanguage] = useState("en");

    const [chapterData, setChapterData] = useState({
        title: "",
        manga_name: "",
        chapter: "",
        pages: []
    });
    
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");

    const eventSourceRef = useRef(null);
    const connectToJob = (jobId) => {

        const eventSource = new EventSource(
            `${API_URL}/translate/stream/${jobId}`
        );

        eventSource.addEventListener(
            "page",
            (event) => {

                const page = JSON.parse(
                    event.data
                );

                console.log(
                    "Page received:",
                    page
                );

                setChapterData((prev) => ({
                    ...prev,
                    pages: [
                        ...prev.pages,
                        page
                    ]
                }));
            }
        );

        eventSource.addEventListener(
            "complete",
            () => {

                setStatus("completed");

                localStorage.removeItem(
                    "urlTranslatorJobId"
                );

                eventSource.close();
            }
        );

        eventSource.onerror = () => {
            console.log(
                "SSE connection closed"
            );

            eventSource.close();
        };

        return eventSource;
    };
    useEffect(() => {

        const savedJobId =
            localStorage.getItem(
                "urlTranslatorJobId"
            );

        if (!savedJobId) {
            return;
        }

        console.log(
            "Restoring job:",
            savedJobId
        );

        connectToJob(savedJobId);

    }, []);
    const handleSendLink = async () => {
        if (!url.trim()) {
            setError("Please enter a webpage URL.");
            return;
        }

        try {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }

            setError("");

            setChapterData({
                title: "",
                manga_name: "",
                chapter: "",
                pages: []
            });

            setStatus("starting");

            const resp = await api.post(
                "/scraper",
                {
                    url: url.trim(),
                    target_language: targetLanguage

                }
            );

            const jobId = resp.data.job_id;
            localStorage.setItem(
                "urlTranslatorJobId",
                jobId
            );
            console.log("Current Job ID:", jobId);

            setStatus("translating");

            const eventSource = new EventSource(
                `${API_URL}/translate/stream/${jobId}`
            );

            eventSourceRef.current = eventSource;

            eventSource.addEventListener("page", (event) => {
                const page = JSON.parse(event.data);

                console.log("Page ready:", page);

                setChapterData((prev) => ({
                    ...prev,
                    pages: [...prev.pages, page]
                }));
            });

            eventSource.addEventListener("complete", () => {
                console.log("Chapter complete");

                setStatus("completed");

                eventSource.close();
                eventSourceRef.current = null;
            });

            eventSource.addEventListener("error", (event) => {
                try {
                    const data = JSON.parse(event.data);

                    setError(
                        data.message || "Translation failed."
                    );
                } catch {
                    setError("Translation failed.");
                }

                setStatus("error");

                eventSource.close();
                eventSourceRef.current = null;
            });

            eventSource.onerror = () => {
                if (status !== "completed") {
                    setError(
                        "Connection to the translation server was lost."
                    );

                    setStatus("error");
                }

                eventSource.close();
                eventSourceRef.current = null;
            };

        } catch (error) {
            console.log(error);

            setStatus("error");

            setError(
                error.response?.data?.detail ||
                "Could not start the translation."
            );
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === "Enter") {
            handleSendLink();
        }
    };
    const PageLoader = ({ pageNumber }) => {
        return (
            <div className="flex min-h-[70vh] w-full items-center justify-center bg-neutral-950">
                <div className="flex flex-col items-center gap-4">

                    <div className="
                        h-10
                        w-10
                        animate-spin
                        rounded-full
                        border-4
                        border-neutral-700
                        border-t-white
                    " />

                    <p className="text-sm text-neutral-500">
                        Translating page {pageNumber}...
                    </p>

                </div>
            </div>
        );
    };
    const handleClear = () => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }

        setUrl("");

        setChapterData({
            title: "",
            manga_name: "",
            chapter: "",
            pages: []
        });

        setStatus("idle");
        setError("");
    };

    const isTranslating =
        status === "starting" ||
        status === "translating";

    return (
        <div className="min-h-screen bg-black text-white">

            <header className="border-b border-neutral-800">
                <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">

                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">
                            Manga Translator
                        </h1>

                        <p className="mt-1 text-sm text-neutral-400">
                            Translate manga pages directly from a webpage
                        </p>
                    </div>

                    <div className="rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-400">
                        AI Translation
                    </div>

                </div>
            </header>


            {/* Main */}
            <main className="mx-auto max-w-5xl px-6 py-10">

                {/* URL Card */}
                <div className="mx-auto max-w-3xl">

                    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-xl">

                        <h2 className="text-lg font-medium">
                            Translate a chapter
                        </h2>

                        <p className="mt-2 text-sm text-neutral-400">
                            Paste the manga chapter URL below and the translated
                            pages will appear as they are ready.
                        </p>


                        {/* Input */}
                        <div className="mt-6">
                            <label className="mb-2 block text-sm text-neutral-400">
                                Target language
                            </label>

                            <select
                                value={targetLanguage}
                                onChange={(e) => setTargetLanguage(e.target.value)}
                                disabled={isTranslating}
                                className="
                                    w-full
                                    rounded-xl
                                    border border-neutral-700
                                    bg-neutral-950
                                    px-4 py-3
                                    text-sm
                                    text-white
                                    outline-none
                                    focus:border-neutral-500
                                    disabled:cursor-not-allowed
                                    disabled:opacity-60
                                "
                            >
                                <option value="en">English</option>
                                <option value="hi">Hindi</option>
                                    
                            </select>
                        </div>
                        <div className="mt-6 flex flex-col gap-3 sm:flex-row">

                            <input
                                type="text"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="https://example.com/manga/chapter-1"
                                disabled={isTranslating}
                                className="
                                    flex-1
                                    rounded-xl
                                    border border-neutral-700
                                    bg-neutral-950
                                    px-4 py-3
                                    text-sm
                                    text-white
                                    outline-none
                                    placeholder:text-neutral-600
                                    focus:border-neutral-500
                                    disabled:cursor-not-allowed
                                    disabled:opacity-60
                                "
                            />
                            
                            <button
                                onClick={handleSendLink}
                                disabled={isTranslating}
                                className="
                                    rounded-xl
                                    bg-white
                                    px-6 py-3
                                    text-sm
                                    font-medium
                                    text-black
                                    transition
                                    hover:bg-neutral-200
                                    disabled:cursor-not-allowed
                                    disabled:bg-neutral-700
                                    disabled:text-neutral-400
                                "
                            >
                                {isTranslating
                                    ? "Translating..."
                                    : "Translate"}
                            </button>

                        </div>


                        {/* Status */}
                        {status === "translating" && (
                            <div className="mt-5 rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3">

                                <div className="flex items-center justify-between text-sm">

                                    <div className="flex items-center gap-3">

                                        <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" />

                                        <span className="text-neutral-300">
                                            Translating chapter...
                                        </span>

                                    </div>

                                    <span className="text-neutral-500">
                                        {chapterData.pages.length} page
                                        {chapterData.pages.length !== 1
                                            ? "s"
                                            : ""} ready
                                    </span>

                                </div>

                            </div>
                        )}


                        {status === "completed" && (
                            <div className="mt-5 rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-300">
                                Translation complete —{" "}
                                {chapterData.pages.length} pages ready.
                            </div>
                        )}


                        {error && (
                            <div className="mt-5 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
                                {error}
                            </div>
                        )}

                    </div>

                </div>


                {/* Chapter Info */}
                {(chapterData.manga_name ||
                    chapterData.chapter ||
                    chapterData.title) && (
                    <div className="mx-auto mt-10 max-w-3xl">

                        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 px-5 py-4">

                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                                <div>

                                    {chapterData.manga_name && (
                                        <h2 className="text-xl font-semibold">
                                            {chapterData.manga_name}
                                        </h2>
                                    )}

                                    {chapterData.chapter && (
                                        <p className="mt-1 text-sm text-neutral-400">
                                            Chapter {chapterData.chapter}
                                        </p>
                                    )}

                                </div>

                                <div className="text-sm text-neutral-500">
                                    {chapterData.pages.length} pages
                                </div>

                            </div>

                        </div>

                    </div>
                )}


                {/* Manga Pages */}
               <div className="mx-auto mt-10 max-w-4xl">

    {chapterData.pages.length === 0 &&
        status === "idle" && (
            <div className="rounded-2xl border border-dashed border-neutral-800 px-6 py-20 text-center">

                <div className="text-4xl">
                    📖
                </div>

                <h3 className="mt-4 text-lg font-medium">
                    Your translated chapter will appear here
                </h3>

                <p className="mt-2 text-sm text-neutral-500">
                    Enter a chapter URL above to get started.
                </p>

            </div>
        )}

    <div className="overflow-hidden rounded-xl bg-black shadow-2xl">

        {chapterData.pages.map((page) => (
            <img
                key={page.page}
                src={page.url}
                alt={`Translated manga page ${page.page}`}
                className="block w-full"
            />
        ))}
        {status === "translating" && (
            <PageLoader
                pageNumber={chapterData.pages.length + 1}
            />
        )}
    </div>

</div>

                {/* Clear Button */}
                {chapterData.pages.length > 0 && (
                    <div className="mt-10 flex justify-center">

                        <button
                            onClick={handleClear}
                            className="
                                rounded-xl
                                border border-neutral-700
                                px-5 py-2.5
                                text-sm
                                text-neutral-300
                                transition
                                hover:bg-neutral-900
                            "
                        >
                            Clear chapter
                        </button>

                    </div>
                )}

            </main>
                
        </div>
    );
}