import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import axios from "axios";
import "./UploadDocument.css";
import { Typography } from "@mui/material";
import { userDetails } from "../../store"; 
import { useSelector } from "react-redux";

const DocumentTable = forwardRef((props, ref) => {
  const [documents, setDocuments] = useState([]);
  const [open, setDialogStatus] = useState(false);
  const [docTobeDeleted, setDocIdTobeDeleted] = useState({});
  const [isReviewed, setIsReviewed] = useState(false);
  const user = useSelector(userDetails);
  // const [associateObj, setAssociate] = useState({
  //   name: 'astik', role: 'ROLE_ASSOCIATE', reviewer: {empId: 'reviewer1', reviewerName: 'Arindam'},
  //   manager: {empId: 'manager1', managerName: 'Arindam'}, empId: '000U2M747'
  // });

  useImperativeHandle(ref, () => ({
    fetchChildDocuments() {
      fetchDocuments();
    }
  }));
  
  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleClose = () => {
    setDialogStatus(false);
  };

  const openDialog = (doc) => {
    setDocIdTobeDeleted(doc);
    setDialogStatus(true);
  };

  const fetchDocuments = () => {
    const id = (user.role==="ROLE_ASSOCIATE") ? user.empId : props.forAssociate.empId;
    const reviewerId = (user.role==="ROLE_ASSOCIATE") ? "" : user.empId;
    var url = props.fetchDocumentURL ? props.fetchDocumentURL : '';
    if(props.type==='REVIEWED'){
        url = url +`/${reviewerId}/employee/${id}`;
    } else {
        url = url +`/${id}`;
    }
    axios
      .get(url)
      .then((res) => {
        //console.log(res.data);
        setDocuments(res.data);
        const filteredObj = res.data.filter(obj => (obj.reviewed==true));
        if(filteredObj.length>0){
          setIsReviewed(true);
        } else {
          setIsReviewed(false);
        }
        if(props.type==='REVIEWED'){
          props.onSyncDocuments({
            revieweddocuments: res.data,
            isReviewed: filteredObj.length>0 ? true : false
          });
        } else {
          props.onSyncDocuments({documents: res.data});
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const download = (id, name) => {
    const url = props.downloadURL ? props.downloadURL : `http://localhost:9003/files/${id}`;
    axios
      .get(url, { responseType: "blob" })
      .then((result) => {
        //console.log(result);
        if (result) {
          const file = new Blob([result.data], { type: "application/pdf" });
          const fileURL = URL.createObjectURL(file);
          var a = document.createElement("a");
          a.href = fileURL;
          a.download = name;
          document.body.appendChild(a);
          a.click();
        }
      })
      .catch((error) => {
        console.error("There was an error!", error);
      });
  };

  const deleteDocs = (id) => {
    const url = props.deleteURL ? props.deleteURL : `http://localhost:9003/files/delete/${id}`;
    axios
      .delete(url)
      .then((result) => {
        setDialogStatus(false);
        fetchDocuments();
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const submitReviewed = () => {
    const id = (user.role==="ROLE_ASSOCIATE") ? user.empId : props.forAssociate.empId;
    const reviewerId = (user.role==="ROLE_ASSOCIATE") ? "" : user.empId;
    axios
      .put(`http://localhost:9003/files/reviewer/${reviewerId}/employee/${id}`)
      .then((result) => {
        setDialogStatus(false);
        fetchDocuments();
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const downloadDocsForAsso = () => {
    const id = (user.role==="ROLE_ASSOCIATE") ? user.empId : props.forAssociate.empId;
    const reviewerId = (user.role==="ROLE_ASSOCIATE") ? "" : user.empId;
    const url = `http://localhost:9003/files/reviewer/${reviewerId}/employee/${id}/zip`;
    axios
      .get(url, { responseType: "blob" })
      .then((result) => {
        if (result) {
          const file = new Blob([result.data], { type: "application/pdf" });
          const fileURL = URL.createObjectURL(file);
          var a = document.createElement("a");
          a.href = fileURL;
          a.download = 'Onboarding_'+id+'.ZIP';
          document.body.appendChild(a);
          a.click();
        }
      })
      .catch((error) => {
        console.error("There was an error!", error);
      });
  };

  return (
    <div>
      {user && (
        <div>
          <div className="button-content">
            <div className="content-left"><h3>{props.title}</h3></div>
            {documents.length > 0  && user.role!=='ROLE_ASSOCIATE' && props.type==='NOTREVIEWED' && ( 
              <div className="content-right">
                <div className="download-icon">
                  <i
                    title="Download All"
                    className="fa fa-download"
                    onClick={() => downloadDocsForAsso()}
                    aria-hidden="true"
                  ></i>
                </div>
              {/* <h3>
                <a href={downloadAllURL.url} className="btn btn-primary">Download All Link</a>
                <Button color="primary" variant="contained" component="span" onClick={() => downloadDocsForAsso()} >
                    Download All 
                </Button>
              </h3> */}
            </div>) }
          </div>
          {documents.length > 0 ? (
            <div className="table-content">
              <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="simple table">
                  <TableHead>
                    <TableRow>
                      <TableCell>S.No.</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Document Type</TableCell>
                      {((user.role!=='ROLE_ASSOCIATE' && props.type==='REVIEWED') || (user.role==='ROLE_ASSOCIATE' && props.type==='NOTREVIEWED')) && 
                        <TableCell>Delete</TableCell>
                      }
                      <TableCell>Download</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {documents.map((doc, i) => (
                      <TableRow
                        key={i}
                        sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                      >
                        <TableCell component="th" scope="row">
                          {i + 1}
                        </TableCell>
                        <TableCell component="th" scope="row">
                          {doc.name}
                        </TableCell>
                        <TableCell component="th" scope="row">
                          {doc.documentType.name}
                        </TableCell>
                        {((user.role!=='ROLE_ASSOCIATE' && props.type==='REVIEWED') || (user.role==='ROLE_ASSOCIATE' && props.type==='NOTREVIEWED')) && 
                          <TableCell>
                            <Button color="secondary" onClick={() => openDialog(doc)}>
                              Delete
                            </Button>
                          </TableCell>
                        }
                        <TableCell>
                          <Button
                            color="primary"
                            onClick={() => download(doc.id, doc.name)}
                          >
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {user.role!=='ROLE_ASSOCIATE' && props.type==='REVIEWED' && 
                      <TableRow>
                        <TableCell>
                            <Button disabled={!(documents.length===props.options.length-1 && !isReviewed)} onClick={() => submitReviewed()}  color="primary" variant="contained" component="span" >
                              Submit Reviewed 
                            </Button>
                        </TableCell>
                      </TableRow>
                    }
                  </TableBody>
                </Table>
              </TableContainer>
            </div>
          ) : (
            <Typography>No Records Exist</Typography>
          )}
        </div>
      )}
      <br/>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {`Are you sure you want to delete the document ${docTobeDeleted.name}?`}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Once deleted canot be reverted.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={() => deleteDocs(docTobeDeleted.id)} autoFocus>
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
});
export default DocumentTable;
