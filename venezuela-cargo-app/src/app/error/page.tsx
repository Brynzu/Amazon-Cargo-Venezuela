export default function ErrorPage() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">Oops!</h1>
        <p className="text-gray-600">Something went wrong. Please try again.</p>
      </div>
    </div>
  )
}
