import React from "react";
import SearchedUser from "./SearchedUser";
import { useSelector } from "react-redux";

export default function SearchedUsers() {
  const { users } = useSelector((state) => state.searchUser);

  return (
    <div>
      {users.length > 0 &&
        users.map((user, i) => <SearchedUser key={i} user={user} />)}
    </div>
  );
}
