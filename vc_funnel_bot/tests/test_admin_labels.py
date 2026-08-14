from __future__ import annotations

import unittest

from bot.admin_labels import (
    lead_status_label,
    material_status_label,
    phase_label,
    route_label,
    source_label,
    ticket_status_label,
)


class AdminLabelsTest(unittest.TestCase):
    def test_webinar_labels_are_human_readable(self) -> None:
        self.assertEqual(phase_label("registration"), "Регистрация открыта")
        self.assertEqual(phase_label("live"), "Эфир идёт")
        self.assertEqual(phase_label("replay"), "Доступна запись")
        self.assertEqual(phase_label("closed"), "Регистрация закрыта")
        self.assertEqual(source_label("direct"), "Прямой вход")
        self.assertEqual(source_label("andrey_main"), "Основной канал Андрея")
        self.assertEqual(route_label("find_business"), "Ищет подходящий бизнес")
        self.assertEqual(route_label("offer"), "Формирует предложение")

    def test_unknown_values_have_safe_russian_fallbacks(self) -> None:
        self.assertEqual(phase_label("new_phase"), "Статус не определён")
        self.assertEqual(source_label("new_source"), "Источник не определён")
        self.assertEqual(route_label("new_route"), "Маршрут не выбран")
        self.assertEqual(lead_status_label("new_status"), "Статус не определён")
        self.assertEqual(ticket_status_label("new_status"), "Статус не определён")
        self.assertEqual(material_status_label("new_status"), "не определён")


if __name__ == "__main__":
    unittest.main()
