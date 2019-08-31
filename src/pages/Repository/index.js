import React, { Component } from 'react';
import PropTypes from 'prop-types';
import api from '../../services/api';
import { Loading, Owner, IssueList, InssueFilter, PageActions } from './styles';
import Container from '../../components/Container';
// import { Container } from './styles';

export default class Repository extends Component {
  constructor(props) {
    super(props);

    this.state = {
      repository: {},
      issues: [],
      loading: true,
      filters: [
        {
          state: 'all',
          label: 'Todas',
          active: true,
        },
        {
          state: 'open',
          label: 'Abertas',
          active: false,
        },
        {
          state: 'closed',
          label: 'Fechadas',
          active: false,
        },
      ],
      filterIndex: 0,
      page: 1,
    };
  }

  async componentDidMount() {
    const { match } = this.props;
    const { filters } = this.state;
    const repoName = decodeURIComponent(match.params.repository);
    const [repository, issues] = await Promise.all([
      api.get(`/repos/${repoName}`),
      api.get(`/repos/${repoName}/issues`, {
        params: {
          state: filters.find(f => f.active).state,
          per_page: 5,
        },
      }),
    ]);

    this.setState({
      repository: repository.data,
      issues: issues.data,
      loading: false,
    });
  }

  loadInssues = async () => {
    const { match } = this.props;
    const { filters, filterIndex, page } = this.state;
    const { state } = filters[filterIndex];

    const repoName = decodeURIComponent(match.params.repository);

    const issues = await api.get(`/repos/${repoName}/issues`, {
      params: {
        state,
        per_page: 5,
        page,
      },
    });

    this.setState({
      issues: issues.data,
    });
  };

  handleFilterClick = async filterIndex => {
    await this.setState({
      filterIndex,
      page: 0,
    });

    await this.loadInssues();
  };

  handlePage = async action => {
    const { page } = this.state;
    await this.setState({
      page: action === 'back' ? page - 1 : page + 1,
    });
    this.loadInssues();
  };

  renderIssueFilter = () => {
    const { filters, filterIndex } = this.state;
    return (
      <InssueFilter active={filterIndex}>
        {filters.map((filter, index) => (
          <button
            type="button"
            key={filter.label}
            onClick={() => this.handleFilterClick(index)}
          >
            {filter.label}
          </button>
        ))}
      </InssueFilter>
    );
  };

  renderIssueList = () => {
    const { issues } = this.state;
    return (
      <IssueList>
        {this.renderIssueFilter()}
        {issues.map(issue => (
          <li key={`${issue.id}`}>
            <img src={issue.user.avatar_url} alt={issue.user.login} />
            <div>
              <strong>
                <a href={issue.html_url}>{issue.title}</a>
                {issue.labels.map(label => (
                  <span key={`${label.id}`}>{label.name}</span>
                ))}
              </strong>
              <p>{issue.user.login}</p>
            </div>
          </li>
        ))}
      </IssueList>
    );
  };

  renderPageAction = () => {
    const { page } = this.state;
    return (
      <PageActions>
        <button
          type="button"
          disabled={page < 2}
          onClick={() => this.handlePage('back')}
        >
          Anterior
        </button>
        <span>Página {page}</span>
        <button type="button" onClick={() => this.handlePage('next')}>
          Próximo
        </button>
      </PageActions>
    );
  };

  render() {
    const { repository, loading } = this.state;
    if (loading) {
      return <Loading>Carregando</Loading>;
    }
    return (
      <Container>
        <Owner>
          <img src={repository.owner.avatar_url} alt={repository.owner.login} />
          <h1>{repository.name}</h1>
          <p>{repository.description}</p>
        </Owner>
        {this.renderIssueList()}
        {this.renderPageAction()}
      </Container>
    );
  }
}

Repository.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      repository: PropTypes.string,
    }),
  }).isRequired,
};
