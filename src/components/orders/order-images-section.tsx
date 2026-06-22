"use client";

import { Trash2, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import {
  createImageUploadTargetsAction,
  deleteOrderImageAction,
  recordOrderImagesAction
} from "@/features/orders/image-actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const BUCKET = "product-images";

export type OrderImagesDict = {
  heading: string;
  intro: string;
  uploadLabel: string;
  uploadSubmit: string;
  uploading: string;
  uploadHint: string;
  empty: string;
  remove: string;
  confirmRemove: string;
};

type OrderImage = { id: string; url: string };

type OrderImagesSectionProps = {
  orderId: string;
  images: OrderImage[];
  dict: OrderImagesDict;
};

export function OrderImagesSection({ orderId, images, dict }: OrderImagesSectionProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedCount, setSelectedCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload() {
    const files = Array.from(inputRef.current?.files ?? []);
    setError(null);

    if (files.length === 0) {
      return;
    }

    setBusy(true);

    try {
      // Server prepares one signed upload URL per file.
      const prep = await createImageUploadTargetsAction(orderId, files.map((file) => file.name));
      if (!prep.ok) {
        setError(prep.error);
        return;
      }

      // Browser uploads each file straight to storage (no server-action size limit).
      const supabase = createSupabaseBrowserClient();
      const uploadedPaths: string[] = [];

      for (let index = 0; index < files.length; index += 1) {
        const target = prep.targets[index];
        const file = files[index];
        if (!target || !file) {
          continue;
        }
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .uploadToSignedUrl(target.path, target.token, file, { contentType: file.type });

        if (uploadError) {
          setError(uploadError.message);
          return;
        }

        uploadedPaths.push(target.path);
      }

      const recorded = await recordOrderImagesAction(orderId, uploadedPaths);
      if (!recorded.ok) {
        setError(recorded.error);
        return;
      }

      if (inputRef.current) {
        inputRef.current.value = "";
      }
      setSelectedCount(0);
      router.refresh();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(imageId: string) {
    if (!window.confirm(dict.confirmRemove)) {
      return;
    }

    setBusy(true);
    setError(null);
    const result = await deleteOrderImageAction(orderId, imageId);

    if (result.ok) {
      router.refresh();
    } else {
      setError(result.error);
    }

    setBusy(false);
  }

  return (
    <div className="status-images">
      <div className="section-heading">
        <h2 className="font-heading">{dict.heading}</h2>
        <p>{dict.intro}</p>
      </div>

      <div className="image-upload">
        <label className="image-upload__field">
          <UploadCloud size={18} aria-hidden="true" />
          <span>{dict.uploadLabel}</span>
          <input
            accept="image/*"
            disabled={busy}
            multiple
            onChange={(event) => setSelectedCount(event.target.files?.length ?? 0)}
            ref={inputRef}
            type="file"
          />
        </label>
        <p className="hint-text">{dict.uploadHint}</p>
        {error ? (
          <p className="form-feedback form-feedback--error" role="alert">
            {error}
          </p>
        ) : null}
        <button
          className="button-base button-primary"
          disabled={busy || selectedCount === 0}
          onClick={handleUpload}
          type="button"
        >
          {busy ? dict.uploading : dict.uploadSubmit}
          {selectedCount > 0 ? ` (${selectedCount})` : ""}
        </button>
      </div>

      {images.length > 0 ? (
        <div className="image-grid">
          {images.map((image) => (
            <div className="image-grid__item" key={image.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="" loading="lazy" src={image.url} />
              <button
                className="row-action row-action--danger"
                disabled={busy}
                onClick={() => handleDelete(image.id)}
                type="button"
              >
                <Trash2 size={16} aria-hidden="true" />
                <span>{dict.remove}</span>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="panel-empty">{dict.empty}</p>
      )}
    </div>
  );
}
