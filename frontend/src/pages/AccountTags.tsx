import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../store/store";
import { fetchTags, addTag,updateTag,deleteTag} from "../store/slices/tagSlice";
import { Box, Button, TextField, List, ListItem, ListItemText, IconButton, Typography } from "@mui/material";
import { FaEdit, FaTrash } from "react-icons/fa";
import { motion } from "framer-motion";
import "./accountTags.scss";

const AccountTags: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [searchTerm, setSearchTerm] = useState("");
  const [newTag, setNewTag] = useState("");
  const { tags, status } = useSelector((state: RootState) => state.tags);

  useEffect(() => {
    if (status === 'idle' && tags.length === 0) {
      dispatch(fetchTags());
    }
  }, [dispatch, status, tags.length]);

  const handleAddTag = () => {
    if (newTag.trim()) {
      dispatch(addTag(newTag));
      setNewTag("");
    }
  };

  const handleDeleteTag = (id: string) => {
    dispatch(deleteTag(id));
  };

  const handleEditTag = (id: string, newName: string) => {
    dispatch(updateTag({ id, name: newName }));
  };

  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0, x: -350 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, x: -350, transition: { duration: 0.5 } },
  };

  return (
    <motion.div
      id="account-tags"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <Box className="account-tags" sx={{ width: "100%", overflow: "hidden" }}>
        <Typography variant="h2" align="left" sx={{ paddingBottom: "2rem" }}>
          Account Tags
        </Typography>
        <Box
          sx={{
            width: "100%",
            height: "calc(100% - 4rem)",
            overflow: "hidden",
          }}
        >
          <TextField
            label="Search Tags"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
            margin="normal"
          />
          <TextField
            label="New Tag"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            fullWidth
            margin="normal"
          />
          <Button onClick={handleAddTag} variant="contained" color="primary">
            Add Tag
          </Button>
          <List>
            {filteredTags.map((tag) => (
              <ListItem key={tag._id}>
                <ListItemText primary={tag.name} />
                <IconButton
                  onClick={() =>
                    handleEditTag(
                      tag._id,
                      prompt("Edit Tag", tag.name) || tag.name
                    )
                  }
                >
                  <FaEdit />
                </IconButton>
                <IconButton onClick={() => handleDeleteTag(tag._id)}>
                  <FaTrash />
                </IconButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Box>
    </motion.div>
  );
};

export default AccountTags;
