import React, { useEffect, useState, useRef } from "react";
import api, { API_URL } from "../api/axios";

export default function ImageTranslater() {
    const [status, setStatus] = useState("idle");
    const [jobId, setJobId] = useState(null);
    const [translatedImages, setTranslatedImages] = useState([]);
    const [selectedImages, setSelectedImages] = useState([]);
    const [error, setError] = useState("");

    const eventSourceRef = useRef(null);

    const createImageObjects = (files) => {
        return files.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
        }));
    };

    const connectToJob = (jobId) => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        setJobId(jobId);
        setStatus("translating");

        const eventSource = new EventSource(
            `${API_URL}/translate/stream/${jobId}`
        );

        eventSourceRef.current = eventSource;

        eventSource.addEventListener("page", (event) => {
            const page = JSON.parse(event.data);

            console.log(
                "Translated image restored/received:",
                page
            );

            setTranslatedImages((prev) => {
                // Prevent duplicate pages
                if (
                    prev.some(
                        (existing) =>
                            existing.page === page.page
                    )
                ) {
                    return prev;
                }

                return [...prev, page];
            });
        });

        eventSource.addEventListener("complete", () => {
            console.log("Image translation complete");

            setStatus("completed");

            localStorage.removeItem(
                "imageTranslatorJobId"
            );

            eventSource.close();
            eventSourceRef.current = null;
        });

        eventSource.addEventListener("error", (event) => {
            console.log("SSE error:", event);

            setStatus("error");

            setError("Translation connection failed.");

            eventSource.close();
            eventSourceRef.current = null;
        });

        eventSource.onerror = () => {
            console.log("SSE connection error");

            setError(
                "Connection to the translation server was lost."
            );

            setStatus("error");

            eventSource.close();
            eventSourceRef.current = null;
        };
    };

    useEffect(() => {
        const savedJobId = localStorage.getItem(
            "imageTranslatorJobId"
        );

        if (!savedJobId) {
            return;
        }

        console.log(
            "Restoring image translation job:",
            savedJobId
        );

        connectToJob(savedJobId);

        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
        };
    }, []);

    const addImages = (files) => {
        const imageFiles = Array.from(files).filter(
            (file) => file.type.startsWith("image/")
        );

        if (imageFiles.length === 0) {
            return;
        }

        setSelectedImages((prev) => {
            const remainingSlots = 10 - prev.length;

            if (remainingSlots <= 0) {
                setError(
                    "You can upload up to 10 images."
                );

                return prev;
            }

            const newFiles = imageFiles.slice(
                0,
                remainingSlots
            );

            if (
                prev.length + imageFiles.length > 10
            ) {
                setError(
                    "Only 10 images can be added."
                );
            } else {
                setError("");
            }

            const newImages = createImageObjects(
                newFiles
            );

            return [
                ...prev,
                ...newImages,
            ];
        });
    };

    const handleImageChange = (event) => {
        addImages(event.target.files);
    };

    const handlePaste = (event) => {
        const items = Array.from(
            event.clipboardData.items
        );

        const imageItems = items.filter(
            (item) => item.type.startsWith("image/")
        );

        if (imageItems.length === 0) {
            return;
        }

        event.preventDefault();

        const files = imageItems
            .map((item) => item.getAsFile())
            .filter(Boolean);

        addImages(files);
    };

    const removeImage = (indexToRemove) => {
        setSelectedImages((prev) =>
            prev.filter(
                (_, index) =>
                    index !== indexToRemove
            )
        );

        setError("");
    };

    const handleImageTranslate = async () => {
        if (selectedImages.length === 0) {
            setError(
                "Please select at least one image."
            );
            return;
        }

        try {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }

            setError("");
            setTranslatedImages([]);
            setStatus("starting");

            const formData = new FormData();

            selectedImages.forEach((image) => {
                formData.append(
                    "files",
                    image.file
                );
            });

            formData.append(
                "target_language",
                "en"
            );

            const response = await api.post(
                "/translate/images",
                formData
            );

            const jobId = response.data.job_id;

            localStorage.setItem(
                "imageTranslatorJobId",
                jobId
            );

            setJobId(jobId);

            console.log(
                "Image translation job:",
                jobId
            );

            setStatus("translating");

            const eventSource = new EventSource(
                `${API_URL}/translate/stream/${jobId}`
            );

            eventSourceRef.current =
                eventSource;

            eventSource.addEventListener(
                "page",
                (event) => {
                    const page = JSON.parse(
                        event.data
                    );

                    console.log(
                        "Translated image ready:",
                        page
                    );

                    setTranslatedImages(
                        (prev) => [
                            ...prev,
                            page,
                        ]
                    );
                }
            );

            eventSource.addEventListener(
                "complete",
                () => {
                    console.log(
                        "Image translation complete"
                    );

                    setStatus("completed");

                    eventSource.close();

                    eventSourceRef.current =
                        null;
                }
            );

            eventSource.addEventListener(
                "error",
                (event) => {
                    try {
                        const data =
                            JSON.parse(
                                event.data
                            );

                        setError(
                            data.message ||
                            "Translation failed."
                        );
                    } catch {
                        setError(
                            "Translation failed."
                        );
                    }

                    setStatus("error");

                    eventSource.close();

                    eventSourceRef.current =
                        null;
                }
            );

            eventSource.onerror = () => {
                setError(
                    "Connection to the translation server was lost."
                );

                setStatus("error");

                eventSource.close();

                eventSourceRef.current =
                    null;
            };
        } catch (error) {
            setStatus("error");

            setError(
                error.response?.data?.detail ||
                "Could not start image translation."
            );
        }
    };

    const PageLoader = ({ pageNumber }) => {
        return (
            <div
                className="
                    flex
                    min-h-[70vh]
                    w-full
                    items-center
                    justify-center
                    bg-neutral-950
                "
            >
                <div className="flex flex-col items-center gap-4">
                    <div
                        className="
                            h-10
                            w-10
                            animate-spin
                            rounded-full
                            border-4
                            border-neutral-700
                            border-t-white
                        "
                    />

                    <p className="text-sm text-neutral-500">
                        Translating image{" "}
                        {pageNumber}...
                    </p>
                </div>
            </div>
        );
    };

    return (
        <div
            className="mt-6"
            onPaste={handlePaste}
            tabIndex={0}
        >
            <label className="mb-2 block text-sm text-neutral-400">
                Upload screenshots
            </label>

            <div
                className="
                    rounded-xl
                    border
                    border-dashed
                    border-neutral-700
                    bg-neutral-950
                    p-6
                    text-center
                    outline-none
                    focus:border-neutral-500
                "
            >
                <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                />

                <label
                    htmlFor="image-upload"
                    className="
                        inline-block
                        cursor-pointer
                        rounded-lg
                        bg-white
                        px-4
                        py-2
                        text-sm
                        font-medium
                        text-black
                    "
                >
                    Choose screenshots
                </label>

                <p className="mt-3 text-sm text-neutral-500">
                    Or copy a screenshot and press{" "}
                    <span className="text-neutral-300">
                        Ctrl + V
                    </span>
                </p>

                <p className="mt-1 text-xs text-neutral-600">
                    Up to 10 images
                </p>
            </div>

            {error && (
                <p className="mt-3 text-sm text-red-400">
                    {error}
                </p>
            )}

            {selectedImages.length > 0 && (
                <div className="mt-5">
                    <p className="mb-3 text-sm text-neutral-400">
                        Selected images (
                        {selectedImages.length}/10)
                    </p>

                    <div
                        className="
                            grid
                            grid-cols-2
                            gap-3
                            sm:grid-cols-3
                            md:grid-cols-5
                        "
                    >
                        {selectedImages.map(
                            (image, index) => (
                                <div
                                    key={`${image.file.name}-${index}`}
                                    className="
                                        relative
                                        overflow-hidden
                                        rounded-xl
                                        border
                                        border-neutral-800
                                        bg-neutral-950
                                    "
                                >
                                    <img
                                        src={
                                            image.preview
                                        }
                                        alt={`Screenshot ${
                                            index + 1
                                        }`}
                                        className="
                                            h-32
                                            w-full
                                            object-cover
                                        "
                                    />

                                    <div
                                        className="
                                            absolute
                                            bottom-0
                                            left-0
                                            right-0
                                            bg-black/70
                                            px-2
                                            py-1
                                        "
                                    >
                                        <p className="truncate text-xs text-white">
                                            {index + 1}.{" "}
                                            {
                                                image
                                                    .file
                                                    .name
                                            }
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            removeImage(
                                                index
                                            )
                                        }
                                        className="
                                            absolute
                                            right-1
                                            top-1
                                            h-6
                                            w-6
                                            rounded-full
                                            bg-black/80
                                            text-xs
                                            text-white
                                        "
                                    >
                                        ×
                                    </button>
                                </div>
                            )
                        )}
                    </div>
                </div>
            )}

            <div className="mt-6 flex justify-center">
                <button
                    type="button"
                    onClick={
                        handleImageTranslate
                    }
                    className="
                        rounded-xl
                        bg-white
                        px-6
                        py-3
                        text-sm
                        font-medium
                        text-black
                        transition
                        hover:bg-neutral-200
                    "
                >
                    Translate images
                </button>
            </div>

            {translatedImages.length > 0 && (
                <div className="mt-10">
                    <h2 className="mb-4 text-lg font-medium text-white">
                        Translated images
                    </h2>

                    <div
                        className="
                            overflow-hidden
                            rounded-xl
                            bg-black
                            shadow-2xl
                        "
                    >
                        {translatedImages.map(
                            (image, index) => (
                                <img
                                    key={image.url}
                                    src={image.url}
                                    alt={`Translated image ${
                                        index + 1
                                    }`}
                                    className="block w-full"
                                />
                            )
                        )}

                        {status ===
                            "translating" && (
                            <PageLoader
                                pageNumber={
                                    translatedImages.length +
                                    1
                                }
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}