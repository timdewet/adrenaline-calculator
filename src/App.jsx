import { useState } from 'react'
import './App.css'

function App() {
  const [mode, setMode] = useState('forward') // 'forward' | 'reverse'
  const [amps, setAmps] = useState('')
  const [weight, setWeight] = useState('')
  const [dose, setDose] = useState('')
  const [volume, setVolume] = useState('')
  const [rate, setRate] = useState('')

  const ampsNum = parseFloat(amps)
  const weightNum = parseFloat(weight)
  const doseNum = parseFloat(dose)
  const volumeNum = parseFloat(volume)
  const rateNum = parseFloat(rate)

  const sharedFilled =
    !isNaN(ampsNum) && ampsNum > 0 &&
    !isNaN(weightNum) && weightNum > 0 &&
    !isNaN(volumeNum) && volumeNum > 0

  const forwardFilled = sharedFilled && !isNaN(doseNum) && doseNum > 0
  const reverseFilled = sharedFilled && !isNaN(rateNum) && rateNum > 0
  const allFilled = mode === 'forward' ? forwardFilled : reverseFilled

  // Shared: concentration always derives from amps + volume
  const totalMcg = ampsNum * 1000
  const concentration = sharedFilled ? totalMcg / volumeNum : null

  let absoluteDose, infusionRate, doseRate, duration
  if (mode === 'forward' && forwardFilled) {
    absoluteDose = doseNum * weightNum
    infusionRate = (doseNum * weightNum * 60) / concentration
    doseRate = doseNum
    duration = volumeNum / infusionRate
  } else if (mode === 'reverse' && reverseFilled) {
    absoluteDose = (rateNum * concentration) / 60
    doseRate = absoluteDose / weightNum
    infusionRate = rateNum
    duration = volumeNum / rateNum
  }

  const durationDisplay = () => {
    if (!allFilled) return null
    const hrs = Math.floor(duration)
    const mins = Math.round((duration - hrs) * 60)
    if (hrs === 0) return `${mins} min`
    if (mins === 0) return `${hrs} hr`
    return `${hrs} hr ${mins} min`
  }

  const handleModeChange = (newMode) => {
    setMode(newMode)
  }

  return (
    <div className="app">
      <header>
        <h1>Adrenaline Infusion Calculator</h1>
        <p className="subtitle">Ampoule concentration: 1 mg / 1 mL (1:1000)</p>
      </header>

      <main>
        <section className="card">
          <div className="mode-toggle">
            <button
              className={`mode-btn${mode === 'forward' ? ' mode-btn--active' : ''}`}
              onClick={() => handleModeChange('forward')}
            >
              Dose &rarr; Rate
            </button>
            <button
              className={`mode-btn${mode === 'reverse' ? ' mode-btn--active' : ''}`}
              onClick={() => handleModeChange('reverse')}
            >
              Rate &rarr; Dose
            </button>
          </div>

          <h2>Infusion Setup</h2>

          <div className="field">
            <label htmlFor="amps">Ampoules used</label>
            <div className="input-wrap">
              <input
                id="amps"
                type="number"
                min="0"
                step="1"
                value={amps}
                onChange={e => setAmps(e.target.value)}
                placeholder="e.g. 5"
              />
              <span className="unit">amp{ampsNum !== 1 ? 's' : ''} &times; 1 mg each</span>
            </div>
          </div>

          <div className="field">
            <label htmlFor="volume">Syringe / bag volume</label>
            <div className="input-wrap">
              <input
                id="volume"
                type="number"
                min="0"
                step="1"
                value={volume}
                onChange={e => setVolume(e.target.value)}
                placeholder="e.g. 50"
              />
              <span className="unit">mL</span>
            </div>
          </div>

          <div className="field">
            <label htmlFor="weight">Patient weight</label>
            <div className="input-wrap">
              <input
                id="weight"
                type="number"
                min="0"
                step="0.1"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                placeholder="e.g. 70"
              />
              <span className="unit">kg</span>
            </div>
          </div>

          {mode === 'forward' ? (
            <div className="field">
              <label htmlFor="dose">Desired dose</label>
              <div className="input-wrap">
                <input
                  id="dose"
                  type="number"
                  min="0"
                  step="0.01"
                  value={dose}
                  onChange={e => setDose(e.target.value)}
                  placeholder="e.g. 0.1"
                />
                <span className="unit">mcg / kg / min</span>
              </div>
            </div>
          ) : (
            <div className="field">
              <label htmlFor="rate">Infusion rate</label>
              <div className="input-wrap">
                <input
                  id="rate"
                  type="number"
                  min="0"
                  step="0.1"
                  value={rate}
                  onChange={e => setRate(e.target.value)}
                  placeholder="e.g. 21.0"
                />
                <span className="unit">mL / hr</span>
              </div>
            </div>
          )}
        </section>

        {allFilled && (
          <section className="card results">
            <h2>Results</h2>

            {mode === 'forward' ? (
              <div className="result-primary">
                <span className="result-label">Infusion rate</span>
                <span className="result-value">{infusionRate.toFixed(1)}</span>
                <span className="result-unit">mL / hr</span>
              </div>
            ) : (
              <div className="result-primary">
                <span className="result-label">Dose rate</span>
                <span className="result-value">{doseRate.toFixed(3)}</span>
                <span className="result-unit">mcg / kg / min</span>
              </div>
            )}

            <div className="result-grid">
              <div className="result-item">
                <span className="result-label">Concentration</span>
                <span className="result-value">{concentration.toFixed(1)}</span>
                <span className="result-unit">mcg / mL</span>
              </div>

              <div className="result-item">
                <span className="result-label">Absolute dose</span>
                <span className="result-value">{absoluteDose.toFixed(2)}</span>
                <span className="result-unit">mcg / min</span>
              </div>

              <div className="result-item">
                <span className="result-label">Duration</span>
                <span className="result-value">{durationDisplay()}</span>
                <span className="result-unit">at current rate</span>
              </div>

              <div className="result-item">
                <span className="result-label">Total adrenaline</span>
                <span className="result-value">{ampsNum}</span>
                <span className="result-unit">mg ({ampsNum * 1000} mcg)</span>
              </div>

              {mode === 'forward' ? (
                <div className="result-item result-item--wide">
                  <span className="result-label">Dose rate</span>
                  <span className="result-value">{doseRate}</span>
                  <span className="result-unit">mcg / kg / min</span>
                </div>
              ) : (
                <div className="result-item result-item--wide">
                  <span className="result-label">Infusion rate</span>
                  <span className="result-value">{infusionRate.toFixed(1)}</span>
                  <span className="result-unit">mL / hr</span>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      <footer>
        <p>Always verify calculations independently before clinical administration.</p>
      </footer>
    </div>
  )
}

export default App
