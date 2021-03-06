import React, { Component } from 'react';
import { Header, Dropdown, Grid, Rating, Divider } from 'semantic-ui-react';
import { Link } from 'gatsby';
import marked from 'marked';

import Layout from '../components/layout';
import CommonCrewData from '../components/commoncrewdata';

type BeholdsPageProps = {
	location: {
		pathname: string;
	}
};

type BeholdsPageState = {
	peopleList: any[];
	currentSelectedItems: any;
	allcrew: any[];
	entries: any[];
};

class BeholdsPage extends Component<BeholdsPageProps, BeholdsPageState> {
	state = {
		peopleList: [],
		currentSelectedItems: [],
		allcrew: [],
		entries: []
	};

	async componentDidMount() {
		let response = await fetch('/structured/crew.json');
		const allcrew = await response.json();

		let peopleList = [];
		allcrew.forEach(crew => {
			peopleList.push({
				key: crew.symbol,
				value: crew.symbol,
				image: { avatar: true, src: `${process.env.GATSBY_ASSETS_URL}${crew.imageUrlPortrait}` },
				text: `${crew.short_name} (${crew.name})`
			});
		});

		this.setState({ allcrew, peopleList }, () => {
			let urlParams = new URLSearchParams(window.location.search);
			if (urlParams.has('crew')) {
				this._selectionChanged(urlParams.getAll('crew'));
			}
		});
	}

	render() {
		if (this.state.allcrew.length === 0) {
			return (
				<Layout title='Behold helper / crew comparison'>
					<div className='ui medium centered text active inline loader'>Loading data...</div>
				</Layout>
			);
		}

		return (
			<Layout title='Behold helper / crew comparison'>
				<Header as='h4'>Behold helper / crew comparison</Header>
				<p>Simply search for the crew you want to compare to get side-by-side views for comparison.</p>
				<Dropdown
					clearable
					fluid
					multiple
					search
					selection
					options={this.state.peopleList}
					placeholder='Select or search for crew'
					label='Behold crew'
					value={this.state.currentSelectedItems}
					onChange={(e, { value }) => this._selectionChanged(value)}
				/>

				<Divider horizontal hidden />

				<Grid columns={3} stackable centered padded divided>
					{this.state.entries.map((entry, idx) => (
						<Grid.Column key={idx}>
							<Header as='h5'>
								<Link to={`/crew/${entry.crew.symbol}/`}>
									{entry.crew.name}{' '}
									<Rating defaultRating={entry.crew.max_rarity} maxRating={entry.crew.max_rarity} icon='star' size='small' disabled />
								</Link>
							</Header>
							<CommonCrewData compact={true} crewDemands={entry.crewDemands} crew={entry.crew} markdownRemark={entry.markdownRemark} />
							{entry.markdown && <div dangerouslySetInnerHTML={{ __html: entry.markdown }} />}
						</Grid.Column>
					))}
				</Grid>
			</Layout>
		);
	}

	_selectionChanged(value: any) {
		let params = new URLSearchParams();
		let entries = [];
		for (let symbol of value) {
			let bcrew = this.state.allcrew.find(bc => bc.symbol === symbol);
			if (!bcrew) {
				console.error(`Crew ${symbol} not found in crew.json!`);
				break;
			}

			// This emulates the Gatsby markdown output until the transition to dynamic loading entirely
			entries.push({
				markdown: marked(bcrew.markdownContent),
				crew: this.state.allcrew.find(c => c.symbol === symbol),
				crewDemands: {
					factionOnlyTotal: bcrew.factionOnlyTotal,
					totalChronCost: bcrew.totalChronCost,
					craftCost: bcrew.craftCost
				},
				markdownRemark: {
					frontmatter: {
						bigbook_tier: bcrew.bigbook_tier,
						events: bcrew.events,
						in_portal: bcrew.in_portal
					}
				}
			});

			params.append('crew', symbol);
		}

		this.setState({ entries, currentSelectedItems: value });

		let newurl = window.location.protocol + '//' + window.location.host + window.location.pathname + '?' + params.toString();
		window.history.pushState({ path: newurl }, '', newurl);
	}
}

export default BeholdsPage;
