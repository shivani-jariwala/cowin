const inquirer = require('inquirer');
const axios = require('axios');
const beep = require('beepbeep');
const util = require('util');
const chalk = require('chalk');

inquirer
    .prompt([
        {
            name: "state",
            type: "input",
            message: "Enter your state"
        },
        {
            name: "district",
            type: "input",
            message: "Enter your district"
        },
        {
            name: "age",
            type: "list",
            message: "Your age?",
            choices: ["18-45", "45+"]
        }
    ])
    .then((answer) => {
        const statename = answer.state;
        const districtname = answer.district;
        const age = answer.age === "18-45" ? 18 : 45

        const main = async () => {
            try {
                const date = new Date();
                let [dd, mm, yy] = date.toLocaleDateString().split('/');
                dd = parseInt(dd) < 10 ? `0${dd}` : dd
                mm = parseInt(mm) < 10 ? `0${mm}` : mm

                const res = await axios.get('https://www.cowin.gov.in/api/v2/admin/location/states')
                const state = res.data.states.filter(a => a.state_name == statename)[0];

                const res2 = await axios.get(`https://www.cowin.gov.in/api/v2/admin/location/districts/${state.state_id}`)
                const district = res2.data.districts.filter(a => a.district_name == districtname)[0];

                const res3 = await axios.get(`https://www.cowin.gov.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id=${district['district_id']}&date=${dd}-${mm}-${yy}`)
                const centers = res3.data.centers.map(center => {

                    const sessions = center.sessions.filter(session => {
                        return (parseInt(session.min_age_limit) <= age) && (session.available_capacity > 0)
                    })

                    if (sessions.length != 0) {

                        const ctr = center
                        ctr.sessions = sessions
                        return ctr

                    }
                    else {

                        return null

                    }

                }).filter(center => center != null)

                if(centers.length!==0){
                    beep(3);
                    console.log(chalk.green(util.inspect(centers, {showHidden: false, depth: null})))
                }

            } catch (error) {

                console.error(error)

            }
        }
        main()
        setInterval(main, 60000)
    });
