import React, { useState } from "react";
import ImageTranslater from "./ImageTranslater";
import SendWebLink from "./SendWebLink";

export default function Home() {

    const [activeTab, setActiveTab] = useState("image");

    return (
        <div className="min-h-screen bg-black text-white">

            <header className="border-b border-neutral-800">
                <div className="mx-auto max-w-5xl px-6 py-5">

                    <div className="flex items-center justify-between">

                        <div>
                            <h1 className="text-xl font-semibold tracking-tight">
                                Manga Translator
                            </h1>

                            <p className="mt-1 text-sm text-neutral-400">
                                Translate manga from images or webpages
                            </p>
                        </div>

                        <div className="rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-400">
                            AI Translation
                        </div>

                    </div>

                </div>
            </header>


            <main className="mx-auto max-w-5xl px-6 py-10">

                <div className="mx-auto max-w-3xl">

                    {/* Tabs */}
                    <div className="mb-6 rounded-xl border border-neutral-800 bg-neutral-900 p-1">

                        <div className="grid grid-cols-2 gap-1">

                            <button
                                type="button"
                                onClick={() => setActiveTab("image")}
                                className={`
                                    rounded-lg
                                    px-4
                                    py-3
                                    text-sm
                                    font-medium
                                    transition
                                    ${
                                        activeTab === "image"
                                            ? "bg-white text-black"
                                            : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                                    }
                                `}
                            >
                                Image Translator
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab("url")}
                                className={`
                                    rounded-lg
                                    px-4
                                    py-3
                                    text-sm
                                    font-medium
                                    transition
                                    ${
                                        activeTab === "url"
                                            ? "bg-white text-black"
                                            : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                                    }
                                `}
                            >
                                Web Translator
                            </button>

                        </div>

                    </div>


                    {/* Tab content */}
                    {activeTab === "image" && (
                        <ImageTranslater />
                    )}

                    {activeTab === "url" && (
                        <SendWebLink />
                    )}

                </div>

            </main>

        </div>
    );
}