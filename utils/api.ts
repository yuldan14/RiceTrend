const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

async function postJson(url: string, body: any) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
}

// ARIMA endpoints
export const predictMediumSilindaArima = (steps: number) =>
  postJson(`${BASE_URL}/predict/medium_silinda`, { steps_ahead: steps }).then(
    (res) => res.prediction
  );

export const predictPremiumSilindaArima = (steps: number) =>
  postJson(`${BASE_URL}/predict/premium_silinda`, { steps_ahead: steps }).then(
    (res) => res.prediction
  );

export const predictMediumBapanasArima = (steps: number) =>
  postJson(`${BASE_URL}/predict/medium_bapanas`, { steps_ahead: steps }).then(
    (res) => res.prediction
  );

export const predictPremiumBapanasArima = (steps: number) =>
  postJson(`${BASE_URL}/predict/premium_bapanas`, { steps_ahead: steps }).then(
    (res) => res.prediction
  );

// LSTM endpoints
export const predictMediumSilindaLstm = (steps: number) =>
  postJson(`${BASE_URL}/predict_lstm/medium_silinda`, { steps_ahead: steps }).then(
    (res) => res.prediction
  );

export const predictPremiumSilindaLstm = (steps: number) =>
  postJson(`${BASE_URL}/predict_lstm/premium_silinda`, { steps_ahead: steps }).then(
    (res) => res.prediction
  );

export const predictMediumBapanasLstm = (steps: number) =>
  postJson(`${BASE_URL}/predict_lstm/medium_bapanas`, { steps_ahead: steps }).then(
    (res) => res.prediction
  );

export const predictPremiumBapanasLstm = (steps: number) =>
  postJson(`${BASE_URL}/predict_lstm/premium_bapanas`, { steps_ahead: steps }).then(
    (res) => res.prediction
  );