"use client";

import { useState } from "react";

interface IndependentDonationFormProps {
  charityId: string;
}

async function readJson(response: Response) {
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

export function IndependentDonationForm({ charityId }: IndependentDonationFormProps) {
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [amount, setAmount] = useState("25");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch(`/api/v1/charities/${charityId}/donate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          donorName,
          donorEmail,
          amount: Number(amount),
          note,
        }),
      });

      const result = await readJson(response);
      setMessage(result.message ?? (response.ok ? "Donation recorded." : "Unable to donate."));

      if (response.ok) {
        setAmount("25");
        setNote("");
      }
    } catch {
      setMessage("Unable to submit your donation right now.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Your name"
        value={donorName}
        onChange={(event) => setDonorName(event.target.value)}
        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none"
      />
      <input
        type="email"
        placeholder="Email"
        value={donorEmail}
        onChange={(event) => setDonorEmail(event.target.value)}
        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none"
      />
      <input
        type="number"
        min={1}
        step={1}
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none"
      />
      <textarea
        placeholder="Optional note"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        className="min-h-28 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none"
      />
      <button
        type="submit"
        disabled={submitting}
        className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
      >
        {submitting ? "Submitting..." : "Give independently"}
      </button>
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </form>
  );
}
