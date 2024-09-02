import React, { useRef } from "react";
import SearchedUsers from "../components/SearchedUsers";
import { useDispatch, useSelector } from "react-redux";
import { clearUsers, searchUsers } from "../context/actions";
import InfiniteScroll from "react-infinite-scroll-component";
import Loader from "../components/Loader";
import "../css/SearchUsers.css"; 

export default function SearchUsers() {
  const searchInputRef = useRef();
  const dispatch = useDispatch();
  const { users, hasMore } = useSelector((state) => state.searchUser);

  return (
    <div>
      <div className="search-bar">
        <input
          ref={searchInputRef}
          onChange={() => {
            if (searchInputRef.current.value === "") {
              dispatch(clearUsers());
              return;
            }

            dispatch(clearUsers());
            dispatch(searchUsers(searchInputRef.current.value));
          }}
          className="search-input"
          id="search-input"
          name="search-text"
          placeholder="Enter name or email"
        />
      </div>

      <InfiniteScroll
        dataLength={users.length}
        next={() => dispatch(searchUsers(searchInputRef.current.value))}
        hasMore={hasMore}
        loader={<Loader />}
        endMessage={
          hasMore ? (
            <p style={{ textAlign: "center" }}>
              <b>There are no such users!</b>
            </p>
          ) : (
            ""
          )
        }
      >
        <SearchedUsers />
      </InfiniteScroll>
    </div>
  );
}
