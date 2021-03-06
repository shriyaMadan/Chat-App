import React, {useRef} from "react";
import "./chatView.css";
import Avatar from "antd/lib/avatar/avatar";
import MessageCard from "./MessageCard";
import {SendOutlined} from "@ant-design/icons";
import {Input, Progress} from "antd";
import {Button} from "react-bootstrap";
import {connect} from "react-redux";
import chatImage from "../../assets/undraw_status_update_jjgk.svg";
import {useEffect} from "react";
import db from "../../Utils/firebase";
import {useState} from "react";
import firebase from "firebase";
var b64toBlob = require("b64-to-blob");

function ChatView({activeChat, user}) {
    const chatRef = useRef();
    const [uploadFile, setUploadFile] = useState();
    const [messagesData, setMessagesData] = useState([]);
    const [message, setMessage] = useState("");
    const [attachment, setAttachment] = useState({});
    const [percent, setPercent] = useState(0);
    const handleMessageChange = e => {
        setMessage(e.target.value);
    };
    const sendMessage = e => {
        if ((!!message || !!attachment.url) && activeChat?.id) {
            const date = new Date().toString();
            const keyRef = db
                .collection("chat-test")
                .doc(activeChat?.id)
                .collection("messages_data")
                .doc();
            keyRef
                .set({
                    username: user.fname + " " + user.lname,
                    content: message,
                    time: date,
                    attachment,
                })
                .then(d => {
                    setMessage("");
                    setUploadFile(null);
                    setAttachment({});
                    setPercent(0);
                });
        }
    };
    useEffect(() => {
        if (activeChat?.id) {
            db.collection("chat-test")
                .doc(activeChat.id)
                .collection("messages_data")
                .onSnapshot(snapshot => {
                    const sortedArray = snapshot.docs
                        .map(doc => doc.data())
                        .sort(function (a, b) {
                            return new Date(a.time) - new Date(b.time);
                        });
                    setMessagesData(sortedArray);
                });
        }
    }, [activeChat]);
    useEffect(() => {
        if (activeChat?.id) {
            chatRef.current.scrollIntoView({behavior: "smooth"});
        }
    }, [messagesData]);
    if (!activeChat?.id) {
        return (
            <div
                className="chat-view"
                style={{
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <img src={chatImage} alt="" />
            </div>
        );
    }
    const handleFileChange = e => {
        e.preventDefault();

        let reader = new FileReader();
        let file = e.target.files[0];
        const date = new Date().valueOf();
        reader.addEventListener(
            "load",
            () => {
                const blob = b64toBlob(btoa(reader.result), "image/jpeg");
                const storageRef = firebase
                    .storage()
                    .ref(`/images/${date + "_" + file.name}`);
                const uploadTask = storageRef.put(file);
                //initiates the firebase side uploading
                uploadTask.on(
                    "state_changed",
                    snapShot => {
                        //takes a snap shot of the process as it is happening
                        setPercent(
                            parseInt(
                                (snapShot.bytesTransferred * 100) /
                                    snapShot.totalBytes
                            )
                        );
                    },
                    err => {
                        //catches the errors
                        console.log(err);
                    },
                    () => {
                        // gets the functions from storage refences the image storage in firebase by the children
                        firebase
                            .storage()
                            .ref("images")
                            .child(date + "_" + file.name)
                            .getDownloadURL()
                            .then(fireBaseUrl => {
                                setAttachment({
                                    type: file.type,
                                    url: fireBaseUrl,
                                });
                            });
                    }
                );
            },
            false
        );
        reader.readAsDataURL(file);
    };
    return (
        <div className="chat-view">
            <div className="chat-view-head">
                <Avatar size="large">
                    <p>{activeChat.title[0]}</p>
                </Avatar>
                <p>{activeChat.title}</p>
            </div>
            <div className="chat-content-comtainer" id="chatDiv">
                {messagesData.map((element, index) => {
                    return (
                        <MessageCard
                            username={element.username}
                            attachment={element.attachment}
                            content={element.content}
                        />
                    );
                })}
                <div ref={chatRef}></div>
            </div>

            <div className="chat-view-foot">
                <div className="uploader d-flex">
                    <input type="file" onChange={handleFileChange} />
                    {percent && (
                        <Progress
                            percent={percent}
                            status={percent === 100 ? null : "active"}
                        />
                    )}
                </div>
                <div className="d-flex">
                    <Input
                        size="middle"
                        onChange={handleMessageChange}
                        placeholder="Type your message here"
                        value={message}
                    />
                    <Button onClick={sendMessage}>
                        <SendOutlined />
                    </Button>
                </div>
            </div>
        </div>
    );
}
const mapStateToProps = state => ({
    activeChat: state.activeChat,
    user: state.user,
});

export default connect(mapStateToProps)(ChatView);
