"use client";

import React from "react";
import { IKVideo, ImageKitProvider } from "imagekitio-next";
import config from "@/lib/config";

const BookVideo = ({ videoUrl }: { videoUrl: string }) => {
  return (
    <ImageKitProvider
      publicKey={config.env.imageKit.publicKey}
      urlEndpoint={config.env.imageKit.urlEndpoint}
    >
      {/*<IKVideo*/}
      {/*  path={videoUrl}*/}
      {/*  controls={true}*/}
      {/*  className="w-full rounded-xl"*/}
      {/*></IKVideo>*/}

      <iframe
        className="w-full h-56 md:h-screen rounded-xl"
        // allow="accelerometer; fullscreen; encrypted-media"
        src={videoUrl}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="no-referrer"
        allowFullScreen
      ></iframe>
    </ImageKitProvider>
  );
};

export default BookVideo;
