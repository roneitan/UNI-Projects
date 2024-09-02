import axios from "axios";
import Cookies from "js-cookie";

const env = process.env.NODE_ENV || "production";
const BASE_URL =
  env === "production" ? "https://bguide.onrender.com" : "http://localhost:443";

axios.interceptors.request.use((req) => {
  const accessToken = Cookies.get("accessToken");
  if (accessToken) req.headers.authorization = accessToken;
  return req;
});

axios.interceptors.response.use(
  (res) => {
    return res;
  },
  async (err) => {
    if (err?.response?.status !== 403) return err;
    Cookies.remove("accessToken");

    const originalRequest = err.config;
    try {
      const refreshToken = Cookies.get("refreshToken");

      const data = await axios.post(`${BASE_URL}/api/user/new-token`, {
        refreshToken: refreshToken ? refreshToken : "",
      });

      if (data instanceof Error) throw data;

      const { accessToken } = data.data;
      Cookies.set("accessToken", `Bearer ${accessToken}`, { expires: 1 });
      const originalResponse = await axios(originalRequest);
      return originalResponse;
    } catch (e) {
      return e;
    }
  }
);

export default axios;
