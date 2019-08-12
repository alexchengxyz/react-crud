import React, { Component } from 'react';
import { Header, Table, Button, Modal, Form, Message, Pagination } from 'semantic-ui-react';
import Search from '../components/Search';
import axios from 'axios';

class Member extends Component {
  constructor(props) {
    super(props);
    this.state = {
      userList: [],
      activePage: 1,
      firstPostsPerPage: 0,
      lastPostsPerPage: 20,
      postsPerPage: 20,
      total: '',
      search: '',
      searchTotal: '',
      paginationTotal: '',
      newMemberData: {
        username: '',
        enable: '0',
        locked: '0',
      },
      editMemberData: {
        id: '',
        username: '',
        enable: '0',
        locked: '0',
      },
      addMemberModal: false,
      editMemberModal: false,
      addError: false,
      editError: false,
    };

    this.newToggleModal = this.newToggleModal.bind(this);
    this.editToggleModal = this.editToggleModal.bind(this);
    this.addMember = this.addMember.bind(this)
    this.updateMember = this.updateMember.bind(this)
    this.handlePaginationChange = this.handlePaginationChange.bind(this);
    this.searchChange = this.searchChange.bind(this);
  }

  componentDidMount() {
    // 讀取資料
    this.refresh(this.state.activePage);
  }

  // 刷新資料
  refresh(number) {
    let { firstPostsPerPage, lastPostsPerPage, postsPerPage } = this.state;
    let lastPost = postsPerPage * number;
    let firstPost = lastPost - postsPerPage;
    let pageNoUrl  = new URLSearchParams();

    pageNoUrl.set('first_result', firstPost);
    pageNoUrl.set('max_results', lastPost);

    axios.get('http://192.168.56.101:9988/api/users?' + pageNoUrl).then((res) => {
      let showPost = res.data.ret.slice(firstPostsPerPage, lastPostsPerPage);
      let itemTotal = res.data.pagination.total;
      let paginationTotal = Math.ceil(itemTotal / postsPerPage);

      this.setState({
        userList: showPost,
        total: itemTotal,
        search: '',
        paginationTotal: paginationTotal
      })
    });
  }

  // 新增資料
  addMember() {
    let { userList, total, paginationTotal, newMemberData } = this.state;

    if (newMemberData.username === '') {
      this.setState({
        addError: true,
        addMemberModal: true
      });
    } else {
      axios.post('http://192.168.56.101:9988/api/user', newMemberData).then((res) => {
        userList.push(res.data.ret);

        this.setState({
          userList: userList,
          total: total + 1,
          paginationTotal: paginationTotal,
          newMemberData: {
            username: '',
            enable: '0',
            locked: '0'
          },
          addMemberModal: false
        });
      });
    }
  }

  // 編輯資料
  editMember(id, username, enable, locked) {
    this.setState({
      editMemberData: { id, username, enable, locked },
      editMemberModal: !this.state.editMemberModal
    });
  }

  updateMember() {
    let { id, username, enable, locked } = this.state.editMemberData;
    let { activePage, search,  } = this.state;

    if (username === '') {
      this.setState({ editError: true });
    } else {
      axios.put('http://192.168.56.101:9988/api/user/' + id, { username, enable, locked }).then(() => {
        if(search === '') {
          this.refresh(activePage);
        } else {
          this.search(search, activePage);
        }

        this.setState({
          activePage: activePage,
          editMemberData: {
            id: '',
            username: '',
            enable: '',
            locked: ''
          },
          editMemberModal: false,
          editError: false
        });

      });
    }
  }

  // 刪除資料
  deleteMember(id) {
    if (confirm('請確認是否刪除')) {
      axios.delete('http://192.168.56.101:9988/api/user/' + id).then(() => {
        let { postsPerPage, activePage, total, search, searchTotal } = this.state;
        let number;
        let allItem;

        if(search === '') {
          allItem = total;
        } else {
          allItem = searchTotal;
        }

        let changeNumber = Math.ceil((allItem - 1) / postsPerPage);

        if (activePage > changeNumber) {
          number = changeNumber;
        } else {
          number = activePage;
        }

        if(search === '') {
          this.refresh(number);
        } else {
          this.search(search, number);
        }
      });
    } else {
      return false;
    }
  }

  // 搜尋
  search(searchText, number) {
    let { firstPostsPerPage, postsPerPage, total } = this.state;
    let lastPost = postsPerPage * number;
    let firstPost = lastPost - postsPerPage;
    let searchUrl  = new URLSearchParams();

    searchUrl.set('first_result', firstPostsPerPage);
    searchUrl.set('max_results', total);
    searchUrl.set('username', searchText);

    axios.get('http://192.168.56.101:9988/api/users?' + searchUrl).then((res) => {
      let paginationTotal = Math.ceil(res.data.ret.length / postsPerPage);
      let showPost = res.data.ret.slice(firstPost, lastPost);

      this.setState({
        userList: showPost,
        search: searchText,
        searchTotal: res.data.ret.length,
        paginationTotal: paginationTotal
      });
    });

  }

  searchChange(e){
    this.setState({ activePage: 1 })

    if (e.target.value) {
      let value = e.target.value;

      this.setState({ search: value });

      this.search(value, 1);
    } else {
      this.refresh(this.state.activePage);
    }
  }

  // 分頁刷頁
  handlePaginationChange(e, {activePage}) {
    this.setState({ activePage });

    if (this.state.search === ''){
      this.refresh(activePage);
    } else {
      this.search(this.state.search, activePage);
    }
  }

  // 彈跳視窗 - 新增資料
  newToggleModal() {
    this.setState({
      addMemberModal: !this.state.addMemberModal,
      addError: false
    });
  }

  // 彈跳視窗 - 編輯資料
  editToggleModal() {
    this.setState({
      editMemberModal: !this.state.editMemberModal,
      editError: false
    });
  }

  render() {
    let { userList, activePage, total, searchTotal,search, paginationTotal } = this.state;
    let showUserList;
    let showPagination;
    let noInfo;

    // 顯示列表
    if (total) {
      showUserList = userList.map((userData) => {
        return(
          <Table.Row key={userData.id}>
            <Table.Cell>{userData.id}</Table.Cell>
            <Table.Cell>{userData.username}</Table.Cell>
            <Table.Cell>{userData.enable}</Table.Cell>
            <Table.Cell>{userData.locked}</Table.Cell>
            <Table.Cell>{userData.created_at}</Table.Cell>
            <Table.Cell>
              <Button
                color="teal"
                onClick={this.editMember.bind(this, userData.id, userData.username, userData.enable, userData.locked)}
              >
                編輯
              </Button>
              <Button
                color="red"
                onClick={this.deleteMember.bind(this, userData.id)}
              >
                刪除
              </Button>
            </Table.Cell>
          </Table.Row>
        )
      });
    }

    if (
      total < 1
      || (search && searchTotal < 1)
    ) {
      noInfo = (
        <Table.Row>
          <Table.Cell colSpan="7">
            <Message>
              <Message.Header>找不到符合條件的內容。</Message.Header>
            </Message>
          </Table.Cell>
        </Table.Row>
      );
    }

    // 顯示頁碼
    if ( paginationTotal > 1 ) {
      showPagination = (
        <div className="ui.clearing.segment">
          <div style={{float: 'right'}} className="ui pagination menu">
            <Pagination
              activePage={activePage}
              onPageChange={this.handlePaginationChange}
              totalPages={paginationTotal}
            />
          </div>
        </div>
      );
    }

    return(
      <div>
        <Header as="h1" className="dividing artivle-title">會員管理</Header>

        <div style={{textAlign: 'right'}}>
          <Search
            value={this.state.search}
            onChange={this.searchChange}
          />
          <Button color="blue" onClick={this.newToggleModal}>新增會員</Button>
        </div>

        <Table celled>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>序號</Table.HeaderCell>
              <Table.HeaderCell>名字</Table.HeaderCell>
              <Table.HeaderCell>是否啟用</Table.HeaderCell>
              <Table.HeaderCell>是否鎖定</Table.HeaderCell>
              <Table.HeaderCell>建立時間</Table.HeaderCell>
              <Table.HeaderCell>設定</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {showUserList}
            {noInfo}
          </Table.Body>
        </Table>

        {showPagination}

        {/* 彈跳視窗 - 新增資料 */}
        <Modal open={this.state.addMemberModal} >
          <Modal.Header>新增會員</Modal.Header>
          <Modal.Content>
            <Form error={this.state.addError}>
              <Form.Group widths='equal'>
                <Form.Input
                  fluid
                  label='姓名'
                  error={this.state.addError}
                  value={this.state.newMemberData.username}
                  onChange={(e) => {
                    let{newMemberData} = this.state;
                    newMemberData.username = e.target.value;
                    this.setState({ newMemberData });
                  }}
                />
              </Form.Group>
              <Message error content="請填寫姓名" />
              <Form.Group widths='equal'>
                <Form.Field
                  label="是否啟動"
                  control="select"
                  value={this.state.newMemberData.enable}
                  onChange={(e) => {
                    let {newMemberData} = this.state;
                    newMemberData.enable = e.target.value;
                    this.setState({ newMemberData });
                  }}
                >
                  <option value="0">否</option>
                  <option value="1">是</option>
                </Form.Field>
                <Form.Field
                  label="是否鎖定"
                  control="select"
                  value={this.state.newMemberData.locked}
                  onChange={(e) => {
                    let {newMemberData} = this.state;
                    newMemberData.locked = e.target.value;
                    this.setState({ newMemberData });
                  }}
                >
                  <option value="0">否</option>
                  <option value="1">是</option>
                </Form.Field>
              </Form.Group>
            </Form>
          </Modal.Content>
          <Modal.Actions>
            <Button color="green" onClick={this.addMember}>確定</Button>
            <Button onClick={this.newToggleModal}>取消</Button>
          </Modal.Actions>
        </Modal>

        {/* 彈跳視窗 - 編輯資料 */}
        <Modal open={this.state.editMemberModal} >
          <Modal.Header>修改會員資料</Modal.Header>
          <Modal.Content>
            <Form error={this.state.editError}>
              <Form.Group widths='equal'>
                <Form.Input
                  fluid
                  label='姓名'
                  error={this.state.editError}
                  value={this.state.editMemberData.username}
                  onChange={(e) => {
                    let{editMemberData} = this.state;
                    editMemberData.username = e.target.value;
                    this.setState({ editMemberData });
                  }}
                />
              </Form.Group>
              <Message error content="請填寫姓名" />
              <Form.Group widths='equal'>
                <Form.Field
                  label="是否啟動"
                  control="select"
                  value={this.state.editMemberData.enable}
                  onChange={(e) => {
                    let {editMemberData} = this.state;
                    editMemberData.enable = e.target.value;
                    this.setState({ editMemberData });
                  }}
                >
                  <option value="0">否</option>
                  <option value="1">是</option>
                </Form.Field>
                <Form.Field
                  label="是否鎖定"
                  control="select"
                  value={this.state.editMemberData.locked}
                  onChange={(e) => {
                    let {editMemberData} = this.state;
                    editMemberData.locked = e.target.value;
                    this.setState({ editMemberData });
                  }}
                >
                  <option value="0">否</option>
                  <option value="1">是</option>
                </Form.Field>
              </Form.Group>
            </Form>
          </Modal.Content>
          <Modal.Actions>
            <Button color="green" onClick={this.updateMember}>更新</Button>
            <Button onClick={this.editToggleModal}>取消</Button>
          </Modal.Actions>
        </Modal>
      </div>
    );
  }
}

export default Member;
