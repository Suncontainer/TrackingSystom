"use client";

import { Trash2 } from "lucide-react";
import { useActionState } from "react";

import { deleteOrderImageAction, uploadOrderImagesAction } from "@/features/orders/image-actions";
import { initialImageActionState } from "@/features/orders/image-form-state";

export type OrderImagesDict = {
  heading: string;
  intro: string;
  uploadLabel: string;
  uploadSubmit: string;
  uploading: string;
  empty: string;
  remove: string;
  confirmRemove: string;
};

type OrderImage = { id: string; url: string };

type OrderImagesSectionProps = {
  orderId: string;
  images: OrderImage[];
  dict: OrderImagesDict;
  showUpload?: boolean;
};

export function OrderImagesSection({ orderId, images, dict, showUpload = true }: OrderImagesSectionProps) {
  const [uploadState, uploadAction, uploading] = useActionState(
    uploadOrderImagesAction,
    initialImageActionState
  );
  const [deleteState, deleteAction] = useActionState(deleteOrderImageAction, initialImageActionState);

  return (
    <div className="status-images">
      {showUpload ? (
        <>
          <div className="section-heading">
            <h2 className="font-heading">{dict.heading}</h2>
            <p>{dict.intro}</p>
          </div>

          <form action={uploadAction} className="admin-form">
            <input name="orderId" type="hidden" value={orderId} />
            <div className="form-field">
              <label htmlFor="order-images-input">{dict.uploadLabel}</label>
              <input accept="image/*" id="order-images-input" multiple name="images" required type="file" />
            </div>
            {uploadState.formError ? (
              <p className="form-feedback form-feedback--error" role="alert">
                {uploadState.formError}
              </p>
            ) : null}
            <button className="button-base button-primary" disabled={uploading} type="submit">
              {uploading ? dict.uploading : dict.uploadSubmit}
            </button>
          </form>
        </>
      ) : null}

      {deleteState.formError ? (
        <p className="form-feedback form-feedback--error" role="alert">
          {deleteState.formError}
        </p>
      ) : null}

      {images.length > 0 ? (
        <div className="image-grid">
          {images.map((image) => (
            <div className="image-grid__item" key={image.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="" loading="lazy" src={image.url} />
              <form
                action={deleteAction}
                onSubmit={(event) => {
                  if (!window.confirm(dict.confirmRemove)) {
                    event.preventDefault();
                  }
                }}
              >
                <input name="orderId" type="hidden" value={orderId} />
                <input name="imageId" type="hidden" value={image.id} />
                <button className="row-action row-action--danger" type="submit">
                  <Trash2 size={16} aria-hidden="true" />
                  <span>{dict.remove}</span>
                </button>
              </form>
            </div>
          ))}
        </div>
      ) : (
        <p className="panel-empty">{dict.empty}</p>
      )}
    </div>
  );
}
