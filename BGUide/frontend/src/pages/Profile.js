import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser, removeFriendRequest, approveFriendRequest } from "../context/actions";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { getUser } from "../context/actions";
import {
  MDBCol,
  MDBContainer,
  MDBRow,
  MDBCard,
  MDBCardText,
  MDBCardBody,
  MDBCardImage,
  MDBTypography,
  MDBIcon,
} from "mdb-react-ui-kit";
import "../css/profile.css";

export default function Profile() {
  const { id, name, email, friendsList, pendingList } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redirect to home page if user is not logged in
  useEffect(() => {
    if (!id) {
      const accessToken = Cookies.get("accessToken");
      if(!accessToken) navigate("/login");
      else dispatch(getUser());
    }
  }, [id, navigate]);

  const pendingListReciever = pendingList.reduce((acc, curr) => {
    if (curr.receiver) acc.push(curr);
    return acc;
  }, []);

  const handleApprove = (friend) => {
    dispatch(approveFriendRequest(friend));
  };

  const handleRemove = (friend) => {
    dispatch(removeFriendRequest(friend));
  };

  return (
    <section className="gradient-custom vh-100">
      <MDBContainer className="py-5 h-100">
        <MDBRow className="justify-content-center align-items-center h-100">
          <MDBCol lg="6" className="mb-4 mb-lg-0">
            <MDBCard
              className="profile-container mb-3"
              style={{ borderRadius: ".5rem" }}
            >
              <MDBRow className="g-0">
                <MDBCol
                  md="4"
                  className="text-center text-white profile-avatar"
                  style={{
                    borderTopLeftRadius: ".5rem",
                    borderBottomLeftRadius: ".5rem",
                  }}
                >
                  <MDBCardImage
                    src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava1-bg.webp"
                    alt="Avatar"
                    className="my-5"
                    style={{ width: "80px" }}
                    fluid
                  />
                  <MDBTypography tag="h5">{name}</MDBTypography>
                  <MDBCardText>Email: {email}</MDBCardText>
                  <MDBIcon far icon="edit mb-5" />
                </MDBCol>
                <MDBCol md="8">
                  <MDBCardBody className="p-4 profile-info">
                    <MDBTypography tag="h5">My Friends</MDBTypography>
                    <hr className="mt-0 mb-4" />

                    {friendsList.length>0 ? (
                      <ul className="friends-list">
                      {friendsList.map((friend, i) => (
                        <li className="action-buttons" key={i}>
                          {friend.name}
                          <button
                            // className="-button-custom"
                            onClick={() => handleRemove(friend)}
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                    ) : (
                      <h6> No friends </h6>
                    )}
                    

                    <MDBTypography tag="h5" className="mt-4">Pending Friend Requests</MDBTypography>
                    <hr className="mt-0 mb-4" />
                    {pendingListReciever.length>0 ? (
                        <ul className="pending-list">
                      
                        {pendingListReciever.map((pending, i) => (
                          <li className="action-buttons" key={i}>
                            {pending.name}
                              <>
                              <button
                                  className="button-custom"
                                  onClick={() => handleApprove(pending)}
                                >
                                  Approve
                                </button>
                                <button
                                  className="-button-custom"
                                  onClick={() => handleRemove(pending)}
                                >
                                  Remove
                                </button>
                            </>
                          </li>
                        ))}
                      </ul>
                      ): (
                        <h6>No pending requests</h6>
                      )

                    }
                    

                    <div
                      className="action-buttons"
                      style={{ marginTop: "20px" }}
                    >
                      <button
                        className="button-custom"
                        style={{ marginRight: "10px" }}
                        onClick={() => navigate("/searchUsers")}
                      >
                        Find more friends
                      </button>
                      <button
                        className="button-custom"
                        onClick={() => {
                          dispatch(logoutUser());
                        }}
                      >
                        Logout
                      </button>
                    </div>
                  </MDBCardBody>
                </MDBCol>
              </MDBRow>
            </MDBCard>
          </MDBCol>
        </MDBRow>
      </MDBContainer>
    </section>
  );
}
