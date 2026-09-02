import test from "node:test";
import assert from "node:assert/strict";
import {
  isImageFile,
  dataUrlToBlob,
  extractImageFromClipboardData,
} from "./image.ts";
import {
  BLUEPEN_CLIPBOARD_MIME,
  serializeElementsForClipboard,
  parseElementsFromClipboard,
  getInternalClipboard,
  setInternalClipboard,
} from "./clipboard.ts";

test("isImageFile correctly identifies image files by mime type and extension", () => {
  assert.equal(isImageFile({ type: "image/png", name: "test.png" }), true);
  assert.equal(isImageFile({ type: "image/jpeg", name: "photo.jpg" }), true);
  assert.equal(isImageFile({ type: "image/webp", name: "graphic.webp" }), true);
  assert.equal(isImageFile({ type: "image/svg+xml", name: "vector.svg" }), true);
  assert.equal(isImageFile({ type: "", name: "screenshot.PNG" }), true);
  assert.equal(isImageFile({ type: "application/octet-stream", name: "diagram.jpeg" }), true);
  assert.equal(isImageFile({ type: "application/octet-stream", name: "icon.avif" }), true);

  assert.equal(isImageFile({ type: "text/plain", name: "notes.txt" }), false);
  assert.equal(isImageFile({ type: "application/json", name: "project.bluepen" }), false);
  assert.equal(isImageFile({ type: "", name: "archive.zip" }), false);
});

test("dataUrlToBlob converts base64 image data URL to Blob", () => {
  const sampleDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  const blob = dataUrlToBlob(sampleDataUrl);
  assert.ok(blob);
  assert.equal(blob.type, "image/png");
  assert.ok(blob.size > 0);

  // Invalid data urls
  assert.equal(dataUrlToBlob(""), null);
  assert.equal(dataUrlToBlob("invalid-string"), null);
});

test("extractImageFromClipboardData extracts image from DataTransfer items", () => {
  const mockFile = { type: "image/png", name: "pasted.png" };
  const mockDataTransfer = {
    items: [
      {
        type: "image/png",
        getAsFile: () => mockFile,
      },
    ],
    files: [],
    getData: () => "",
  };

  const extracted = extractImageFromClipboardData(mockDataTransfer);
  assert.deepEqual(extracted, mockFile);
});

test("extractImageFromClipboardData extracts image from DataTransfer files", () => {
  const mockFile = { type: "image/jpeg", name: "photo.jpg" };
  const mockDataTransfer = {
    items: [],
    files: [mockFile],
    getData: () => "",
  };

  const extracted = extractImageFromClipboardData(mockDataTransfer);
  assert.deepEqual(extracted, mockFile);
});

test("extractImageFromClipboardData extracts base64 image from HTML img tag", () => {
  const dataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  const mockDataTransfer = {
    items: [],
    files: [],
    getData: (type) => (type === "text/html" ? `<div class="content"><img src="${dataUrl}" alt="clip" /></div>` : ""),
  };

  const extracted = extractImageFromClipboardData(mockDataTransfer);
  assert.ok(extracted);
  assert.equal(extracted.type, "image/png");
});

test("extractImageFromClipboardData returns null when no image is present", () => {
  const mockDataTransfer = {
    items: [{ type: "text/plain", getAsFile: () => null }],
    files: [{ type: "text/plain", name: "document.txt" }],
    getData: () => "plain text snippet",
  };

  assert.equal(extractImageFromClipboardData(mockDataTransfer), null);
  assert.equal(extractImageFromClipboardData(null), null);
});

test("External image paste has priority over old internal clipboard cache", () => {
  const oldElement = {
    id: "el-old-1",
    type: "rectangle",
    name: "Old Rect",
    x: 100,
    y: 100,
    width: 200,
    height: 100,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    autoLayout: null,
    children: [],
    props: {},
    parentId: null,
  };
  setInternalClipboard([oldElement]);
  assert.ok(getInternalClipboard());

  const mockImageFile = { type: "image/png", name: "screenshot.png" };
  const mockClipboardData = {
    items: [{ type: "image/png", getAsFile: () => mockImageFile }],
    files: [mockImageFile],
    getData: (mime) => (mime === "text/plain" ? "" : ""),
  };

  const parsedElements = parseElementsFromClipboard(mockClipboardData.getData(BLUEPEN_CLIPBOARD_MIME));
  assert.equal(parsedElements, null);

  const image = extractImageFromClipboardData(mockClipboardData);
  assert.ok(image, "Image should be extracted successfully without being hijacked by internal cache");
  assert.equal(image.name, "screenshot.png");
});
