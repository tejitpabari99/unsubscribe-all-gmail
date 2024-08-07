import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { FaSearch, FaSync, FaSort, FaSortUp, FaSortDown, FaCheck, FaTimes  } from 'react-icons/fa';

function App() {
  const [emails, setEmails] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEmails, setSelectedEmails] = useState({});
  const [expandedRows, setExpandedRows] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEmails, setFilteredEmails] = useState([]);
  const [sortColumn, setSortColumn] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [unsubscribeStatus, setUnsubscribeStatus] = useState({});
  // const SERVER_URL = "https://unsubscribe-all-gmail-16421015f897.herokuapp.com";

  const handleAuth = async () => {
    try {
      const response = await axios.get('/auth/gmail');
      const authWindow = window.open(response.data.url, '_blank', 'width=500,height=600');
      
      const handleMessage = async (event) => {
        // if (event.origin !== SERVER_URL) return;
        if (event.data.token) {
          window.removeEventListener('message', handleMessage);
          authWindow.close();
          setAuthToken(event.data.token);
          await fetchEmails(event.data.token);
        }
      };

      window.addEventListener('message', handleMessage);
    } catch (error) {
      console.error('Authentication error:', error);
    }
  };

  const fetchEmails = async (token) => {
    setIsLoading(true);
    setUnsubscribeStatus({});
    setSelectedEmails({});
    try {
      const response = await axios.get('/api/unsubscribe-emails', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const groupedEmails = groupEmailsBySender(response.data);
      setEmails(groupedEmails);
      setFilteredEmails(groupedEmails);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error fetching emails:', error);
      handleLogout();
    } finally {
      setIsLoading(false);
    }
  };

  const groupEmailsBySender = (emailList) => {
    const groupedEmails = {};
    emailList.forEach(email => {
      if (email){
        if (!groupedEmails[email.senderEmail]) {
          groupedEmails[email.senderEmail] = {
            senderName: email.senderName,
            senderEmail: email.senderEmail,
            emails: []
          };
        }
        groupedEmails[email.senderEmail].emails.push(email);
      }
    });
    return Object.values(groupedEmails);
  };

  useEffect(() => {
    const filtered = emails.filter(group => 
      group.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.senderEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.emails.some(email => email.subject.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredEmails(filtered);
  }, [searchTerm, emails]);

  useEffect(() => {
    handleLogout();
  }, []);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAuthToken(null);
    setEmails([]);
    setSelectedEmails({});
    setExpandedRows({});
    setSearchTerm('');
    setFilteredEmails([]);
    setUnsubscribeStatus({});
    setIsLoading(false);
  };

  const handleCheckboxChange = (senderEmail) => {
    setSelectedEmails(prev => ({ ...prev, [senderEmail]: !prev[senderEmail] }));
  };

  const handleSelectAll = () => {
    if (Object.keys(selectedEmails).length > 0) {
      setSelectedEmails({});
    } else {
      const newSelectedEmails = {};
      console.log(filteredEmails);
      filteredEmails.forEach(group => {
        newSelectedEmails[group.senderEmail] = true;
      });
      console.log(filteredEmails);
      setSelectedEmails(newSelectedEmails);
    }
  };

  const handleUnsubscribe = async () => {
    const groupsToUnsubscribe = filteredEmails.filter(group => selectedEmails[group.senderEmail]);

    for (const group of groupsToUnsubscribe) {
      const { senderEmail, emails } = group;
      const emailIds = emails.map(email => email.id);
      const unsubscribeLink = emails[0].unsubscribeLink;

      setUnsubscribeStatus(prev => ({ ...prev, [senderEmail]: 'loading' }));
      try {
        await axios.post('/api/unsubscribe', { senderEmail, emailIds, unsubscribeLink }, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        setUnsubscribeStatus(prev => ({ ...prev, [senderEmail]: 'success' }));
      } catch (error) {
        console.error('Error unsubscribing:', error);
        setUnsubscribeStatus(prev => ({ ...prev, [senderEmail]: 'failure' }));
      }
    }
  };

  const toggleRowExpansion = (senderEmail) => {
    setExpandedRows(prev => ({ ...prev, [senderEmail]: !prev[senderEmail] }));
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }

    const sortedEmails = [...filteredEmails].sort((a, b) => {
      const valueA = a[column].toLowerCase();
      const valueB = b[column].toLowerCase();

      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredEmails(sortedEmails);
  };

  const isAnyEmailSelected = Object.values(selectedEmails).some(Boolean);

  return (
    <div>
      <div className="App">
        <h1>Gmail Unsubscribe App</h1>
        {isAuthenticated && (
          <button className="logout-button" onClick={handleLogout}>Logout</button>
        )}
        {isLoading ? (
          <div className="loading-spinner"></div>
        ) : !isAuthenticated ? (
          <button onClick={handleAuth}>Connect to Gmail</button>
        ) : (
          <div>
            <div className="search-bar">
              <input 
                type="text" 
                placeholder="Search emails..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button onClick={() => {}}><FaSearch /></button>
              <button onClick={() => fetchEmails(authToken)}><FaSync /></button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={filteredEmails.length > 0 && filteredEmails.every(group => selectedEmails[group.senderEmail])}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th onClick={() => handleSort('senderName')}>
                    Sender Name
                    {sortColumn === 'senderName' && (
                      sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />
                    )}
                    {sortColumn !== 'senderName' && <FaSort />}
                  </th>
                  <th onClick={() => handleSort('senderEmail')}>
                    Sender Email
                    {sortColumn === 'senderEmail' && (
                      sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />
                    )}
                    {sortColumn !== 'senderEmail' && <FaSort />}
                  </th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredEmails.map((group) => (
                  <React.Fragment key={group.senderEmail}>
                    <tr>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedEmails[group.senderEmail] || false}
                          onChange={() => handleCheckboxChange(group.senderEmail)}
                        />
                      </td>
                      <td>{group.senderName}</td>
                      <td>{group.senderEmail}</td>
                      <td>
                        {unsubscribeStatus[group.senderEmail] === 'loading' && <span className="loading-spinner-small"></span>}
                        {unsubscribeStatus[group.senderEmail] === 'success' && <span className="success-icon icon-container"><FaCheck /></span>}
                        {unsubscribeStatus[group.senderEmail] === 'failure' && 
                          (
                            <div className="icon-text-container">
                              <span className="icon-container failure-icon"><FaTimes /></span>
                              <a href={group.emails[0].unsubscribeLink} 
                                className="unsubscribe-link">
                                Unsubscribe
                              </a>
                            </div>
                          )}
                      </td>
                      <td>
                        <button onClick={() => toggleRowExpansion(group.senderEmail)}>
                          {expandedRows[group.senderEmail] ? '▲' : '▼'}
                        </button>
                      </td>
                    </tr>
                    {expandedRows[group.senderEmail] && (
                      <tr>
                        <td colSpan="4">
                          <ul>
                            {group.emails.map(email => (
                              <li key={email.id}>
                                [{new Date(email.date).toLocaleString('en-US', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                  })}]{' '}
                                <a href={email.url} target="_blank" rel="noopener noreferrer">
                                  {email.subject}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
            <div className="action-buttons">
              <button onClick={handleUnsubscribe} disabled={!isAnyEmailSelected}>
                Unsubscribe
              </button>
            </div>
          </div>
        )}
      </div>
      <footer className="footer">
          <p>&copy; 2024 Tejit</p>
          <p>
            <a href="https://www.flaticon.com/free-icons/unsubscribe" 
                title="unsubscribe icons">
                  Unsubscribe icons created by Freepik - Flaticon
            </a>
          </p>
        </footer>
    </div>
  );
}

export default App;