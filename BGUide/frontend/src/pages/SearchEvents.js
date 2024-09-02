import React, { useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { clearEvents, searchEvents } from "../context/actions";
import { redirect } from "react-router-dom";
import InfiniteScroll from "react-infinite-scroll-component";
import Loader from "../components/Loader";
import SearchedEvents from "../components/SearchedEvents";
import {
  MDBCol,
  MDBContainer,
  MDBRow,
  MDBCard,
  MDBCardBody,
  MDBTypography,
  MDBIcon,
} from "mdb-react-ui-kit";
import "../css/profile.css";

export default function SearchEvents() {
  const searchInputRef = useRef();
  const dispatch = useDispatch();
  const { events, hasMore } = useSelector((state) => state.searchEvent);

  return (
    <section className="vh-100" style={{ backgroundColor: "#f4f5f7" }}>
      <MDBContainer className="py-5 h-100">
        <MDBRow className="justify-content-center align-items-center h-100">
          <MDBCol lg="6" className="mb-4 mb-lg-0">
            <MDBCard className="mb-3" style={{ borderRadius: ".5rem" }}>
              <MDBCardBody className="p-4 gradient-custom">
                <MDBTypography tag="h5">Search Events</MDBTypography>
                <button
                  onClick={() => redirect(-1)}
                  style={{ marginBottom: "10px" }}
                >
                  <MDBIcon icon="arrow-left" /> Back
                </button>
                <input
                  ref={searchInputRef}
                  onChange={() => {
                    if (searchInputRef.current.value === "") {
                      dispatch(clearEvents());
                      return;
                    }

                    dispatch(clearEvents());
                    dispatch(searchEvents(searchInputRef.current.value));
                  }}
                  id="search-input"
                  name="search-text"
                  placeholder="Enter event name or description"
                />

                <InfiniteScroll
                  dataLength={events.length}
                  next={() =>
                    dispatch(searchEvents(searchInputRef.current.value))
                  }
                  hasMore={hasMore}
                  loader={<Loader />}
                  endMessage={
                    hasMore ? (
                      <p style={{ textAlign: "center" }}>
                        <b>There are no more events!</b>
                      </p>
                    ) : (
                      ""
                    )
                  }
                >
                  <SearchedEvents />
                </InfiniteScroll>
              </MDBCardBody>
            </MDBCard>
          </MDBCol>
        </MDBRow>
      </MDBContainer>
    </section>
  );
}
