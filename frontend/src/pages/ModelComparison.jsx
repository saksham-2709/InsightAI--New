import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiService } from '../services/apiService'
import { ArrowLeft, BarChart3, Loader2, Trophy } from 'lucide-react'

const ModelComparison = () => {
  const [models, setModels] = useState([])
  const [leftId, setLeftId] = useState('')
  const [rightId, setRightId] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiService.getModels()
        setModels(data)
        if (data.length >= 2) {
          setLeftId(String(data[0].id))
          setRightId(String(data[1].id))
        } else if (data.length === 1) {
          setLeftId(String(data[0].id))
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const left = models.find((m) => String(m.id) === leftId)
  const right = models.find((m) => String(m.id) === rightId)

  const compatible = useMemo(() => {
    if (!left) return models
    return models.filter((m) => m.task_type === left.task_type)
  }, [models, left])

  const metrics = useMemo(() => {
    if (!left || !right || left.task_type !== right.task_type) return []
    if (left.task_type === 'classification') return ['accuracy', 'precision', 'recall', 'f1_score', 'roc_auc']
    if (left.task_type === 'regression') return ['r2_score', 'rmse', 'mae']
    return ['silhouette_score']
  }, [left, right])

  const label = (key) => key.replace(/_/g, ' ').replace(/w/g, (c) => c.toUpperCase())

  const bestModel = useMemo(() => {
    if (!left || !right || left.task_type !== right.task_type) return null
    if (left.task_type === 'classification') {
      return (left.metrics?.f1_score ?? -Infinity) >= (right.metrics?.f1_score ?? -Infinity) ? left.id : right.id
    }
    if (left.task_type === 'regression') {
      return (left.metrics?.r2_score ?? -Infinity) >= (right.metrics?.r2_score ?? -Infinity) ? left.id : right.id
    }
    return (left.metrics?.silhouette_score ?? -Infinity) >= (right.metrics?.silhouette_score ?? -Infinity) ? left.id : right.id
  }, [left, right])

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/models" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Compare Models</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Evaluate trained models side by side before selecting one.</p>
        </div>
      </div>

      {models.length < 2 ? (
        <div className="card p-10 text-center">
          <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Train at least two models</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Create another model to unlock model comparison.</p>
          <Link to="/models" className="inline-flex mt-5 btn-primary">Go to Models</Link>
        </div>
      ) : (
        <>
          <div className="card p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Model A</label>
                <select className="input-field" value={leftId} onChange={(e) => setLeftId(e.target.value)}>
                  {models.map((model) => <option key={model.id} value={model.id}>{model.name} — {model.task_type}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Model B</label>
                <select className="input-field" value={rightId} onChange={(e) => setRightId(e.target.value)}>
                  {compatible.map((model) => <option key={model.id} value={model.id}>{model.name} — {model.task_type}</option>)}
                </select>
              </div>
            </div>
          </div>

          {left && right && left.task_type === right.task_type ? (
            <>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {[['Model A', left], ['Model B', right]].map(([title, model]) => {
                  const isBest = model.id === bestModel
                  return (
                    <div key={model.id} className="card p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{model.name}</p>
                        </div>
                        {isBest && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-200">
                            <Trophy className="h-3.5 w-3.5" /> Stronger metric
                          </span>
                        )}
                      </div>

                      <div className="mt-5 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Algorithm</span>
                          <span className="font-medium text-gray-900 dark:text-white">{model.algorithm}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Target</span>
                          <span className="text-gray-900 dark:text-white">{model.target_column || 'N/A'}</span>
                        </div>
                        {metrics.map((metric) => (
                          <div key={metric} className="flex justify-between border-t border-gray-100 dark:border-gray-700 pt-3 text-sm">
                            <span className="text-gray-600 dark:text-gray-300">{label(metric)}</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {typeof model.metrics?.[metric] === 'number' ? model.metrics[metric].toFixed(4) : '—'}
                            </span>
                          </div>
                        ))}
                      </div>

                      <Link to={`/models/${model.id}`} className="inline-flex mt-5 btn-secondary text-sm">
                        View full results
                      </Link>
                    </div>
                  )
                })}
              </div>

              <div className="card p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">How to read the comparison</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  For classification, the stronger card is based on F1 Score. For regression, it is based on R² Score.
                  For clustering, it is based on Silhouette Score. Use this as a quick comparison, then consider data quality,
                  business context and the full metric set before choosing a model.
                </p>
              </div>
            </>
          ) : (
            <div className="card p-6 text-sm text-gray-600 dark:text-gray-300">
              Select two models from the same task type to compare them.
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ModelComparison
