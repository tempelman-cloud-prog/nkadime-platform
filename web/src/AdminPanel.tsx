import React from 'react';
import { Box, Typography, Paper, Tabs, Tab } from '@mui/material';

const AdminPanel: React.FC = () => {
  const [tab, setTab] = React.useState(0);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4, p: 2 }}>
      <Typography variant="h4" fontWeight={800} color="#FF9800" mb={3}>
        Admin Panel
      </Typography>
      <Paper elevation={2} sx={{ mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Users" />
          <Tab label="Listings" />
          <Tab label="Rentals" />
          <Tab label="Disputes" />
          <Tab label="Analytics" />
        </Tabs>
      </Paper>
      <Box>
        {tab === 0 && <Typography>User management coming soon...</Typography>}
        {tab === 1 && <Typography>Listing management coming soon...</Typography>}
        {tab === 2 && <Typography>Rental management coming soon...</Typography>}
        {tab === 3 && <Typography>Dispute resolution coming soon...</Typography>}
        {tab === 4 && <Typography>Analytics coming soon...</Typography>}
      </Box>
    </Box>
  );
};

export default AdminPanel;
