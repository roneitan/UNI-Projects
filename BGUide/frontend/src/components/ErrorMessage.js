import React from "react";
import { useDispatch } from "react-redux";
import { setUserError } from "../context/actions";


export default function ErrorMessage({ message }) {
  const dispatch = useDispatch();
  return <div> <button onClick={() => dispatch(setUserError(""))}>X</button>{message}</div>;
}
