import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiService } from '../services/apiService'
import {
  ArrowLeft,
  Database,
  Loader2,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  FileText
} from 'lucide-react'

const DatasetProfile = () => {
  const { id } = useParams()
  const [dataset, setDataset] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [datasetData, previewData] = await Promise.all([
          apiService.getDataset(id),
          apiService.getDatasetPreview(id)
        ])
        setDataset(datasetData)
        setPreview(previewData)
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load dataset profile')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const info = preview?.info || {}
  const columns = Object.entries(info)
  const totalMissing = columns.reduce((sum, [, value]) => sum + Number(value.missing_count || 0), 0)
  const totalCells = Number(preview?.shape?.[0] || 0) * Math.max(columns.length, 1)
  const quality = totalCells ? Math.max(0, Math.round(100 - (totalMissing / totalCells) * 100)) : 100

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (error || !dataset) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Unable to load dataset</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-4">{error || 'Dataset not found'}</p>
        <Link to="/dashboard" className="btn-primary">Back to Dashboard</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <Database className="h-6 w-6 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{dataset.name}</h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Dataset profile, schema and data-quality overview
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="card p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Rows</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
            {Number(dataset.row_count || 0).toLocaleString()}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Columns</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{dataset.column_count || 0}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Missing Cells</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{totalMissing.toLocaleString()}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Data Quality</p>
          <div className="mt-1 flex items-center gap-2">
            {quality >= 90
              ? <CheckCircle className="h-5 w-5 text-green-500" />
              : <AlertTriangle className="h-5 w-5 text-amber-500" />}
            <span className="text-2xl font-semibold text-gray-900 dark:text-white">{quality}%</span>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Column Profile</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                <th className="px-3 py-3">Column</th>
                <th className="px-3 py-3">Type</th>
                <th className="px-3 py-3">Missing</th>
                <th className="px-3 py-3">Unique</th>
                <th className="px-3 py-3">Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {columns.map(([column, value]) => (
                <tr key={column}>
                  <td className="px-3 py-3 font-medium text-gray-900 dark:text-white">{column}</td>
                  <td className="px-3 py-3 text-gray-600 dark:text-gray-300 capitalize">{value.type}</td>
                  <td className="px-3 py-3 text-gray-600 dark:text-gray-300">
                    {Number(value.missing_count || 0).toLocaleString()} ({Number(value.missing_percentage || 0).toFixed(1)}%)
                  </td>
                  <td className="px-3 py-3 text-gray-600 dark:text-gray-300">
                    {Number(value.unique_count || 0).toLocaleString()}
                  </td>
                  <td className="px-3 py-3 text-gray-600 dark:text-gray-300">
                    {value.type === 'integer' || value.type === 'float'
                      ? `${value.min ?? '—'} → ${value.max ?? '—'} | mean ${value.mean != null ? Number(value.mean).toFixed(2) : '—'}`
                      : value.type === 'categorical'
                        ? `top: ${Object.keys(value.top_values || {}).slice(0, 3).join(', ') || '—'}`
                        : 'Text / identifier column'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Data Preview</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700 text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                {(preview?.columns || []).map((column) => (
                  <th key={column} className="px-3 py-2 whitespace-nowrap">{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(preview?.head || []).slice(0, 8).map((row, index) => (
                <tr key={index} className="border-t border-gray-100 dark:border-gray-700">
                  {(preview?.columns || []).map((column) => (
                    <td key={column} className="px-3 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {String(row[column] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default DatasetProfile
