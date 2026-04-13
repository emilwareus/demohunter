import { z } from "zod";

export const PORTABLE_OUTPUT_MANIFEST_VERSION = 1;

const portableChecksumSchema = z
  .object({
    algorithm: z.literal("sha256"),
    byteSize: z.int().nonnegative(),
    hex: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();

const portableArtifactDescriptorSchema = z
  .object({
    path: z.string().min(1),
    mediaType: z.string().min(1),
    checksum: portableChecksumSchema,
  })
  .strict();

const timelineChapterSchema = z
  .object({
    title: z.string().min(1),
    startMs: z.int().nonnegative(),
  })
  .strict();

const timelineNarrationSchema = z
  .object({
    cacheKey: z.string().min(1),
    text: z.string().min(1),
    chapterTitle: z.string().min(1).optional(),
    startMs: z.int().nonnegative(),
    endMs: z.int().nonnegative(),
    durationMs: z.int().nonnegative(),
  })
  .strict()
  .refine(
    (value) => value.endMs >= value.startMs && value.durationMs === value.endMs - value.startMs,
    {
      message: "Narration timing must be internally consistent.",
    },
  );

const literalArtifactDescriptor = (artifactPath: string) =>
  portableArtifactDescriptorSchema.extend({
    path: z.literal(artifactPath),
  });

const audioArtifactDescriptorSchema = portableArtifactDescriptorSchema
  .extend({
    path: z.string().regex(/^audio\/.+/),
    cacheKey: z.string().min(1),
    durationMs: z.int().nonnegative(),
  })
  .strict();

export const portableOutputManifestSchema = z
  .object({
    manifestVersion: z.literal(PORTABLE_OUTPUT_MANIFEST_VERSION),
    tour: z
      .object({
        id: z.string().min(1),
        title: z.string().min(1),
      })
      .strict(),
    playback: z
      .object({
        durationMs: z.int().nonnegative(),
      })
      .strict(),
    artifacts: z
      .object({
        videos: z
          .object({
            mp4: literalArtifactDescriptor("video.mp4"),
            webm: literalArtifactDescriptor("video.webm").optional(),
          })
          .strict(),
        poster: literalArtifactDescriptor("poster.jpg")
          .extend({
            captureTimestampMs: z.int().nonnegative(),
          })
          .strict(),
        captions: z
          .object({
            srt: literalArtifactDescriptor("captions.srt"),
            vtt: literalArtifactDescriptor("captions.vtt"),
          })
          .strict(),
        chapters: literalArtifactDescriptor("chapters.json"),
        audio: z.array(audioArtifactDescriptorSchema),
      })
      .strict(),
    timeline: z
      .object({
        chapters: z.array(timelineChapterSchema),
        narrations: z.array(timelineNarrationSchema),
      })
      .strict(),
  })
  .strict();

export type PortableChecksum = z.infer<typeof portableChecksumSchema>;
export type PortableArtifactDescriptor = z.infer<typeof portableArtifactDescriptorSchema>;
export type PortableOutputManifest = z.infer<typeof portableOutputManifestSchema>;

export function parsePortableOutputManifest(value: unknown): PortableOutputManifest {
  return portableOutputManifestSchema.parse(value);
}
