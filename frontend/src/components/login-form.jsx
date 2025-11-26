import { Button } from "../components/ui/button"
import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"

const backend_url='http://localhost:3000';
//google login 
export function LoginForm() {
  //states to hangle form
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
//Effect when mounted and location changes
  useEffect(() => {
    // Check for error message in URL
    //get data  token and user from backend 
    const params = new URLSearchParams(window.location.search)
    const errorMsg = params.get('error')
    if (errorMsg) {
      setError(decodeURIComponent(errorMsg))
      return;
    }
    // Check for successful OAuth login
    console.log("log from  efect");
   const userData = params.get('user')
if (userData) {
  try {
    const user = JSON.parse(decodeURIComponent(userData))
    console.log('Parsed user data:', user);

    // Store user data locally
    localStorage.setItem('user', JSON.stringify(user))

    // Redirect after login
    const redirectUrl = '/user-home'
    navigate(redirectUrl)
  } catch (err) {
    console.error('Failed to parse user data:', err)
    setError('Authentication failed. Please try again.')
  }
}

  }, [location])

  //email submit 
  // recieves token and user both are set in localstore

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch(backend_url+`/api/emailauth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Login failed');
      }

      
      
      // Store user data
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Go to userhome on succesfull login
      const redirectUrl = '/user-home';
      
      // Force a page reload to ensure all components update
      navigate(redirectUrl);
    } catch (err) {
      setError(err.message || 'Invalid email or password');
      console.error('Login error:', err)
    } finally {
      setLoading(false);
    }
  }

  const handleGoogleLogin = () => {
    setLoading(true)
    setError("")
    
    // Store the current URL to redirect back after login
    localStorage.setItem('redirectUrl', location.state?.from || '/user-home')
    
    console.log('Initiating Google OAuth login');
    // Redirect to Google OAuth endpoint
    window.location.href = backend_url+`/api/googleauth/google`
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Welcome back</h2>
      
      {/* Google Login Button */}
      <button
        onClick={handleGoogleLogin}
        className="w-full mb-4 flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
        disabled={loading}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
          />
        </svg>
        {loading ? 'Please wait...' : 'Continue with Google'}
      </button>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with email</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 text-sm text-red-600 bg-red-50 rounded flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="m@example.com"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            required
            disabled={loading}
          />
        </div>
        <Button 
          type="submit" 
          className="w-full bg-blue-600 hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login with Email'}
        </Button>
      </form>

      <div className="mt-4 text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <button
          onClick={() => navigate('/register')}
          className="text-blue-600 hover:underline font-medium"
          disabled={loading}
        >
          Sign up
        </button>
      </div>
    </div>
  )
}