import { useState, useEffect } from 'react'
import { DRUGS } from './drugConfigs.js'
import './App.css'

function App() {
  // ── Install prompt ────────────────────────────────────────────────────────
  const [installPrompt, setInstallPrompt] = useState(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Don't show if already installed as a standalone app
    const alreadyInstalled =
      window.navigator.standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches
    if (alreadyInstalled) return

    // iOS: no beforeinstallprompt — show manual instructions
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    if (ios) {
      setIsIOS(true)
      setShowInstallBanner(true)
      return
    }

    // Android / Chrome: capture the deferred prompt
    const handler = e => {
      e.preventDefault()
      setInstallPrompt(e)
      setShowInstallBanner(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setShowInstallBanner(false)
    setInstallPrompt(null)
  }

  // ── Calculator state ──────────────────────────────────────────────────────
  const [drugId, setDrugId] = useState('adrenaline')
  const [mode, setMode] = useState('forward') // 'forward' | 'reverse'
  const [amps, setAmps] = useState('')
  const [volume, setVolume] = useState('')
  const [weight, setWeight] = useState('')
  const [dose, setDose] = useState('')
  const [rate, setRate] = useState('')

  const config = DRUGS.find(d => d.id === drugId)

  const handleDrugChange = (id) => {
    setDrugId(id)
    setAmps('')
    setVolume('')
    setDose('')
    setRate('')
    // weight intentionally preserved — it's the patient, not the drug
  }

  // ── Parsed numbers ────────────────────────────────────────────────────────
  const ampsNum   = parseFloat(amps)
  const volumeNum = parseFloat(volume)
  const weightNum = parseFloat(weight)
  const doseNum   = parseFloat(dose)
  const rateNum   = parseFloat(rate)

  // ── Completeness checks ───────────────────────────────────────────────────
  const sharedFilled =
    !isNaN(ampsNum)   && ampsNum   > 0 &&
    !isNaN(volumeNum) && volumeNum > 0 &&
    !isNaN(weightNum) && weightNum > 0

  const forwardFilled = sharedFilled && !isNaN(doseNum) && doseNum > 0
  const reverseFilled = sharedFilled && !isNaN(rateNum) && rateNum > 0
  const allFilled = mode === 'forward' ? forwardFilled : reverseFilled

  // ── Core calculations ─────────────────────────────────────────────────────
  const concentration = sharedFilled
    ? (ampsNum * config.mcgPerAmp) / volumeNum   // mcg/mL
    : null

  let absoluteDose, infusionRate, doseRate, duration

  if (mode === 'forward' && forwardFilled) {
    absoluteDose = doseNum * weightNum                          // mcg/min
    infusionRate = (doseNum * weightNum * 60) / concentration  // mL/hr
    doseRate     = doseNum
    duration     = volumeNum / infusionRate                    // hr
  } else if (mode === 'reverse' && reverseFilled) {
    absoluteDose = (rateNum * concentration) / 60              // mcg/min
    doseRate     = absoluteDose / weightNum                    // mcg/kg/min
    infusionRate = rateNum
    duration     = volumeNum / rateNum                         // hr
  }

  // ── Warning logic ─────────────────────────────────────────────────────────
  const ca = config.centralAccess
  const showWarning = allFilled && (
    ca.type === 'always' ||
    (ca.type === 'threshold' && doseRate > ca.thresholdDose)
  )
  const warningLevel = ca.type === 'always' ? 'danger' : 'amber'

  // ── Titration table ───────────────────────────────────────────────────────
  const titrationRows = sharedFilled
    ? config.titrationSteps.map(step => ({
        dose: step,
        rate: (step * weightNum * 60) / concentration,
        aboveThreshold:
          ca.type === 'threshold' && step > ca.thresholdDose,
      }))
    : []

  const activeStep = allFilled && titrationRows.length
    ? titrationRows.reduce((prev, curr) =>
        Math.abs(curr.dose - doseRate) < Math.abs(prev.dose - doseRate) ? curr : prev
      ).dose
    : null

  // ── Duration formatting ───────────────────────────────────────────────────
  const durationDisplay = () => {
    if (!allFilled) return null
    const hrs  = Math.floor(duration)
    const mins = Math.round((duration - hrs) * 60)
    if (hrs === 0) return `${mins} min`
    if (mins === 0) return `${hrs} hr`
    return `${hrs} hr ${mins} min`
  }

  const ampPlural = ampsNum === 1 ? config.ampUnitLabel : `${config.ampUnitLabel}s`

  return (
    <div className="app">
      <header>
        <h1>Vasopressor Calculator</h1>
      </header>

      {/* ── Drug selector ─────────────────────────────────────────────── */}
      <div className="drug-tabs">
        {DRUGS.map(d => (
          <button
            key={d.id}
            className={`drug-tab${drugId === d.id ? ' drug-tab--active' : ''}`}
            onClick={() => handleDrugChange(d.id)}
          >
            {d.label}
          </button>
        ))}
      </div>

      <main>
        <section className="card">
          <div className="mode-toggle">
            <button
              className={`mode-btn${mode === 'forward' ? ' mode-btn--active' : ''}`}
              onClick={() => setMode('forward')}
            >
              Dose &rarr; Rate
            </button>
            <button
              className={`mode-btn${mode === 'reverse' ? ' mode-btn--active' : ''}`}
              onClick={() => setMode('reverse')}
            >
              Rate &rarr; Dose
            </button>
          </div>

          <h2>Infusion Setup</h2>
          <p className="drug-note">{config.ampLabel}</p>

          <div className="field">
            <label htmlFor="amps">
              {config.ampUnitLabel.charAt(0).toUpperCase() + config.ampUnitLabel.slice(1)}s used
            </label>
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
              <span className="unit">
                {ampPlural} &times; {config.mgPerAmp} mg each
              </span>
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
                  step={config.doseStep}
                  value={dose}
                  onChange={e => setDose(e.target.value)}
                  placeholder={`e.g. ${config.dosePlaceholder}`}
                />
                <span className="unit">{config.doseUnit}</span>
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
                  placeholder="e.g. 5.0"
                />
                <span className="unit">mL / hr</span>
              </div>
            </div>
          )}
        </section>

        {/* ── Results ───────────────────────────────────────────────────── */}
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
                <span className="result-unit">{config.doseUnit}</span>
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
                <span className="result-label">Total drug</span>
                <span className="result-value">{(ampsNum * config.mgPerAmp).toFixed(0)}</span>
                <span className="result-unit">mg ({(ampsNum * config.mcgPerAmp).toLocaleString()} mcg)</span>
              </div>

              {mode === 'forward' ? (
                <div className="result-item result-item--wide">
                  <span className="result-label">Dose rate</span>
                  <span className="result-value">{doseRate}</span>
                  <span className="result-unit">{config.doseUnit}</span>
                </div>
              ) : (
                <div className="result-item result-item--wide">
                  <span className="result-label">Infusion rate</span>
                  <span className="result-value">{infusionRate.toFixed(1)}</span>
                  <span className="result-unit">mL / hr</span>
                </div>
              )}
            </div>

            {showWarning && (
              <div className={`warning warning--${warningLevel}`}>
                <span className="warning-icon">{warningLevel === 'danger' ? '🚨' : '⚠️'}</span>
                <div>
                  <strong>
                    {ca.type === 'always'
                      ? 'Central access required'
                      : 'High dose — central access recommended'}
                  </strong>
                  <p>{ca.warningText}</p>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── Titration table ───────────────────────────────────────────── */}
        {sharedFilled && (
          <section className="card card--titration">
            <h2>Titration Table</h2>
            {ca.type === 'always' && (
              <div className="warning warning--danger warning--compact">
                <span className="warning-icon">🚨</span>
                <strong>Central access required for all doses</strong>
              </div>
            )}
            <div className="titration-table-wrap">
              <table className="titration-table">
                <thead>
                  <tr>
                    <th className="col-left">Dose ({config.doseUnit})</th>
                    <th>Rate (mL / hr)</th>
                  </tr>
                </thead>
                <tbody>
                  {titrationRows.map(row => (
                    <tr
                      key={row.dose}
                      className={[
                        row.dose === activeStep  ? 'row--current'         : '',
                        row.aboveThreshold       ? 'row--above-threshold' : '',
                      ].join(' ').trim()}
                    >
                      <td className="col-left">
                        {row.aboveThreshold && (
                          <span className="row-warn-icon">⚠</span>
                        )}
                        {row.dose}
                      </td>
                      <td>{row.rate.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {/* ── Install banner ────────────────────────────────────────────── */}
      {showInstallBanner && (
        <div className="install-banner">
          <img src="/icon.svg" className="install-icon" alt="" />
          <div className="install-text">
            <strong>Install VasoCalc</strong>
            {isIOS
              ? <span>Tap <strong>Share</strong> then <strong>Add to Home Screen</strong></span>
              : <span>Add to your home screen for offline use</span>
            }
          </div>
          {!isIOS && (
            <button className="install-btn" onClick={handleInstall}>Install</button>
          )}
          <button className="install-dismiss" onClick={() => setShowInstallBanner(false)} aria-label="Dismiss">✕</button>
        </div>
      )}

      <footer>
        <p>Always verify calculations independently before clinical administration.</p>
        <p className="footer-credit">Built by Timothy de Wet with the help of Claude</p>
      </footer>
    </div>
  )
}

export default App
