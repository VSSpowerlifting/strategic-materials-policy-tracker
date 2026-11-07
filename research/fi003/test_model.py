"""Financial meaning, timing boundaries and scenario isolation for the working model."""
import copy
import json
import unittest
from datetime import date
from decimal import Decimal as D
from pathlib import Path
import model
import prototype as p

ROOT=Path(__file__).resolve().parent


class ModelTests(unittest.TestCase):
    def setUp(self):
        self.data=json.loads((ROOT/'inputs.json').read_text())

    def test_first_quarter_strictly_after_trigger(self):
        for trigger,expected in [('2027-08-15','2027-09-30'),('2027-09-30','2027-12-31'),
            ('2027-12-31','2028-03-31'),('2027-06-30','2027-09-30'),
            ('2028-02-29','2028-03-31'),('2028-03-30','2028-03-31')]:
            self.assertEqual(p.first_test_quarter(date.fromisoformat(trigger)),date.fromisoformat(expected))

    def test_timing_anchors_are_calendar_bounds_not_cod_forecasts(self):
        outputs=model.scenario(self.data)
        self.assertEqual(outputs['Credit!B46'],93)
        self.assertEqual(outputs['Credit!B47'],458)
        self.assertEqual(outputs['Credit!B43'],model.serial('2027-09-30'))
        self.assertEqual(model.scenario(self.data,{'trigger':'2027-09-30'})['Credit!B46'],1)

    def test_bad_control_is_missing_or_invalid_not_zero(self):
        for overrides,target in [({'draw':204},'Credit!B21'),({'sofr':None},'Credit!B23'),
            ({'state':'Invalid'},'Support!B14'),({'year':2024},'Support!B14'),
            ({'capacity':-.1},'Support!B14'),({'benchmark':None},'Support!B24'),
            ({'trigger':'2027-02-30'},'Credit!B43')]:
            self.assertEqual(model.scenario(self.data,overrides)[target],'INVALID')

    def test_payout_states_and_capacity_have_distinct_effects(self):
        pre=model.scenario(self.data,{'state':'Pre-COD','benchmark':70})
        self.assertEqual(pre['Support!B14'],'')
        self.assertEqual(pre['Support!B22'],40)  # PPA operates before 10X COD.
        post=model.scenario(self.data,{'state':'From milestone','capacity':.25})
        self.assertEqual(post['Support!B14'],D('151.5405024'))
        self.assertEqual(post['Support!B23'],9)
        above=model.scenario(self.data,{'capacity':1.1})
        self.assertEqual(above['Support!B14'],D('166.69455264'))  # no invented 100% cap

    def test_controls_never_modify_historical_facts(self):
        before=copy.deepcopy(self.data)
        model.scenario(self.data,{'draw':203,'sofr':.05,'benchmark':70,'state':'From milestone'})
        self.assertEqual(self.data,before)
        spec=model.build()
        controls={c['cell'] for c in spec['controls'].values()}
        for name in ['Financing','Liquidity','Guide_Sources']:
            for cell in spec['sheets'][name]['cells'].values():
                formula=cell.get('formula','').replace("'",'')
                self.assertTrue(all(target not in formula for target in controls))

    def test_checks_are_terminal_and_dates_units_sources_present(self):
        spec=model.build()
        for name,sheet in spec['sheets'].items():
            if name!='Checks':
                self.assertFalse(any('Checks!' in c.get('formula','').replace("'",'') for c in sheet['cells'].values()))
        self.assertEqual(len(spec['controls']),11)
        self.assertTrue(all(v['rationale'] and v['unit'] and v['class']=='hypothetical' for v in self.data['model_controls'].values()))
        self.assertEqual(self.data['facts']['commissioning_year']['source'],'S19')


if __name__=='__main__': unittest.main()
