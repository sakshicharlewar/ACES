#include <iostream>
using namespace std;

int main()
{
    int num, rev = 0;
    cout << "enter a number";
    cin >> num;
    int original = num;
    while (num > 0)
    {
        rev = rev * 10 + num % 10;
        num /= 10;
    }
    if (rev ==original)
    {
        cout << "the number is palidrome";
    }
    else
    {
        cout << "the number is not palidrome";
    }
}
