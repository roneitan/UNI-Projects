import React from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  approveFriendRequest,
  removeFriendRequest,
  sendFriendRequest,
} from "../context/actions";

export default function SearchedUser({ user }) {
  const { name, email } = user;
  const { friendsList, pendingList } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  return (
    <div>
      <p>{name}</p>
      <p>{email}</p>
      {friendsList.find((friend) => friend.email === email) ? (
        <>
          is friend
          <button onClick={() => dispatch(removeFriendRequest(user))}>
            remove
          </button>
        </>
      ) : pendingList.find(
          (pending) => pending.email === email && pending.receiver
        ) ? (
        <>
          pending
          <button onClick={() => dispatch(approveFriendRequest(user))}>
            approve
          </button>
          <button onClick={() => dispatch(removeFriendRequest(user))}>
            remove
          </button>
        </>
      ) : pendingList.find(
          (pending) => pending.email === email && !pending.receiver
        ) ? (
        <>
          pending
          <button onClick={() => dispatch(removeFriendRequest(user))}>
            remove
          </button>
        </>
      ) : (
        <button
          onClick={() => {
            dispatch(sendFriendRequest(user));
          }}
        >
          add friend
        </button>
      )}
    </div>
  );
}
