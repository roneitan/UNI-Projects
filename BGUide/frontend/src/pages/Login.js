import React, { useEffect, useRef } from "react";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import Link from "@mui/material/Link";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Typography from "@mui/material/Typography";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../context/actions";
import { useNavigate } from "react-router-dom";
import ErrorMessage from "../components/ErrorMessage";
import "../css/login.css";

function Copyright(props) {
  return (
    <Typography
      variant="body2"
      align="center"
      className="login-copyright"
      {...props}
    >
      {"Copyright © "}
      <Link color="inherit" href="https://mui.com/">
        BGUide
      </Link>{" "}
      {new Date().getFullYear()}
      {"."}
    </Typography>
  );
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#FF8C00', // Dark orange
    },
    secondary: {
      main: '#FFA500', // Orange
    },
  },
});

export default function SignInSide() {
  const emailRef = useRef();
  const passwordRef = useRef();
  const dispatch = useDispatch();
  const { error } = useSelector((state) => state.user);
  const { id } = useSelector((state) => state.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) navigate("/explorer");
  }, [id, navigate]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="login-container">
        <div className="login-overlay">
          <div className="login-popup">
            <Typography component="h1" variant="h4" className="login-headline">
              BGUide
            </Typography>
            <Box className="login-paper">
              <Avatar className="login-avatar">
                <LockOutlinedIcon />
              </Avatar>
              <Typography component="h1" variant="h5" className="login-title">
                Sign In
              </Typography>
              <Box
                component="form"
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  const email = emailRef.current.value;
                  const password = passwordRef.current.value;
                  const emailError = document.getElementById("email-error");
                  const passwordError = document.getElementById("password-error");

                  emailError.textContent = "";
                  passwordError.textContent = "";
                  let isValid = true;

                  if (email === "") {
                    emailError.textContent = "Please enter email address.";
                    isValid = false;
                  }

                  if (password === "") {
                    passwordError.textContent = "Please enter password.";
                    isValid = false;
                  }
                  if (!isValid) return;
                  dispatch(loginUser({ email, password }));
                }}
                className="login-form"
              >
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  inputRef={emailRef}
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  className="login-input"
                  InputProps={{
                    style: { color: '#FF8C00' }
                  }}
                />
                <span id="email-error" className="error-message"></span>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  inputRef={passwordRef}
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="current-password"
                  className="login-input"
                  InputProps={{
                    style: { color: '#FF8C00' }
                  }}
                />
                <span id="password-error" className="error-message"></span>
                {error && <ErrorMessage message={error} />}
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  className="login-button"
                  sx={{ 
                    backgroundColor: 'orange', 
                    '&:hover': { backgroundColor: 'darkorange' },
                    color: 'white' // This changes the text color to white
                  }}
                >
                  Sign In
                </Button>
                <Grid container justifyContent="center">
                  <Grid item>
                    <div className="login-link">
                      <Link href="/register" variant="body2">
                        Don't have an account? Sign Up
                      </Link>
                    </div>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </div>
        </div>
      </div>
      <Copyright sx={{ color: '#FFA500' }} />
    </ThemeProvider>
  );
}
