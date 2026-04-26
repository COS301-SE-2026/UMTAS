import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "@jest/globals";
import HelloButton from "./HelloButton";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("HelloButton", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("renders the button with correct text", () => {
    render(<HelloButton />);
    const button = screen.getByRole("button", { name: /hello world/i });
    expect(button).toBeInTheDocument();
  });

  it("has the correct id for testing", () => {
    render(<HelloButton />);
    const button = document.getElementById("hello-world-btn");
    expect(button).toBeInTheDocument();
  });

  it("shows loading state when clicked", async () => {
    mockFetch.mockImplementation(
      () => new Promise(() => {}), // never resolves — stays loading
    );

    render(<HelloButton />);
    const button = screen.getByRole("button", { name: /hello world/i });

    fireEvent.click(button);

    expect(button).toBeDisabled();
    expect(
      screen.getByRole("button").querySelector(".hello-button-spinner"),
    ).toBeInTheDocument();
  });

  it("displays success response after successful API call", async () => {
    const mockResponse = {
      success: true,
      message: "Hello World",
      id: "test-uuid-1234",
      createdAt: "2026-04-20T00:00:00Z",
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    render(<HelloButton />);
    fireEvent.click(screen.getByRole("button", { name: /hello world/i }));

    await waitFor(() => {
      expect(screen.getByText("Full Stack Connected!")).toBeInTheDocument();
    });

    expect(screen.getByText("Hello World")).toBeInTheDocument();
    expect(screen.getByText("test-uuid-1234")).toBeInTheDocument();
  });

  it("displays error message on API failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(<HelloButton />);
    fireEvent.click(screen.getByRole("button", { name: /hello world/i }));

    await waitFor(() => {
      expect(screen.getByText("Connection Failed")).toBeInTheDocument();
    });

    expect(
      screen.getByText("API responded with status 500"),
    ).toBeInTheDocument();
  });

  it("displays error message on network failure", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Failed to fetch"));

    render(<HelloButton />);
    fireEvent.click(screen.getByRole("button", { name: /hello world/i }));

    await waitFor(() => {
      expect(screen.getByText("Connection Failed")).toBeInTheDocument();
    });

    expect(screen.getByText("Failed to fetch")).toBeInTheDocument();
  });

  it("calls the correct API endpoint", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          message: "Hello World",
          id: "1",
          createdAt: "",
        }),
    });

    render(<HelloButton />);
    fireEvent.click(screen.getByRole("button", { name: /hello world/i }));

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:3000/health/hello",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
  });
});
