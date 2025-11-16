export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">О нас</h1>

        <div className="prose max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Aimak Akshamy - Городская газета</h2>
            <p className="text-gray-700 mb-4">
              Добро пожаловать в Aimak Akshamy - вашу городскую газету, которая держит вас в курсе
              всех важных событий, новостей и историй нашего города.
            </p>
            <p className="text-gray-700 mb-4">
              Мы стремимся предоставлять актуальную, достоверную и интересную информацию для всех
              жителей города. Наша редакция работает круглосуточно, чтобы вы всегда были в курсе
              последних событий.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Наша миссия</h2>
            <p className="text-gray-700 mb-4">
              Наша цель - быть надежным источником информации для жителей города, освещать важные
              события, поднимать актуальные вопросы и способствовать развитию общественного диалога.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Что мы освещаем</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Городские новости и события</li>
              <li>Политика и управление</li>
              <li>Культура и искусство</li>
              <li>Спорт</li>
              <li>Образование</li>
              <li>Бизнес и экономика</li>
              <li>Социальные вопросы</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Свяжитесь с нами</h2>
            <p className="text-gray-700 mb-2">
              <strong>Email:</strong> info@aimak-akshamy.kz
            </p>
            <p className="text-gray-700 mb-2">
              <strong>Телефон:</strong> +7 (XXX) XXX-XX-XX
            </p>
            <p className="text-gray-700 mb-2">
              <strong>Адрес редакции:</strong> г. [Название города], ул. [Название улицы], д. XX
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
